import { db } from "@hono-commerce/db";
import { notification } from "@hono-commerce/db/schema/notification";
import {
  createRedisConnection,
  enqueueEmail,
  type NotificationJobData,
  QueueName,
} from "@hono-commerce/queue";
import { type Job, Worker } from "bullmq";

export function createNotificationWorker(): Worker<NotificationJobData> {
  const worker = new Worker<NotificationJobData>(
    QueueName.NOTIFICATIONS,
    async (job: Job<NotificationJobData>) => {
      const data = job.data;
      console.log(
        `[Worker:Notification] Processing fanout job ${job.id} (${data.jobType})`,
      );

      if (data.jobType === "tenant-notifications-fanout") {
        const targetRoles = data.targetRoles ?? ["owner", "member"];

        // 1. Resolve active tenant members matching target roles
        const matchingMemberships = await db.query.tenantMember.findMany({
          columns: { userId: true, role: true },
          where: (membership, { and, eq, inArray }) =>
            and(
              eq(membership.tenantId, data.tenantId),
              eq(membership.status, "active"),
              inArray(membership.role, targetRoles),
            ),
        });

        const membershipByUserId = new Map(
          matchingMemberships.map((membership) => [
            membership.userId,
            membership,
          ]),
        );
        const activeUsers =
          matchingMemberships.length === 0
            ? []
            : await db.query.user.findMany({
                columns: { id: true, email: true },
                where: (memberUser, { and, eq, inArray }) =>
                  and(
                    eq(memberUser.status, "active"),
                    inArray(
                      memberUser.id,
                      matchingMemberships.map(
                        (membership) => membership.userId,
                      ),
                    ),
                  ),
              });
        const activeMembers = activeUsers.flatMap((memberUser) => {
          const membership = membershipByUserId.get(memberUser.id);
          return membership
            ? [
                {
                  userId: memberUser.id,
                  email: memberUser.email,
                  role: membership.role,
                },
              ]
            : [];
        });

        if (activeMembers.length === 0) {
          console.log(
            `[Worker:Notification] No matching active members for tenant ${data.tenantId}`,
          );
          return { dispatched: 0 };
        }

        // 2. Fetch user preferences in bulk
        const userIds = activeMembers.map((m) => m.userId);
        const preferences = await db.query.notificationPreference.findMany({
          where: (preference, { inArray }) =>
            inArray(preference.userId, userIds),
        });

        const prefsMap = new Map(preferences.map((p) => [p.userId, p]));

        let inAppCount = 0;
        let emailCount = 0;
        const inAppNotificationsToInsert: (typeof notification.$inferInsert)[] =
          [];

        for (const member of activeMembers) {
          const pref = prefsMap.get(member.userId);

          // Check if notification type is muted
          if (pref?.mutedNotificationTypes?.includes(data.type)) {
            continue;
          }

          const inAppEnabled = pref?.enabledChannels
            ? pref.enabledChannels.includes("inApp")
            : true;
          const emailEnabled = pref?.enabledChannels
            ? pref.enabledChannels.includes("email")
            : true;

          // 3. Queue in-app notification row per recipient member
          if (inAppEnabled && data.channels?.inApp !== false) {
            inAppNotificationsToInsert.push({
              userId: member.userId,
              tenantId: data.tenantId,
              type: data.type,
              title: data.title,
              message: data.message,
              actionUrl: data.actionUrl ?? null,
              metadata: data.metadata ?? null,
              idempotencyKey: `${job.id}:${member.userId}:in-app`,
              isRead: false,
            });
            inAppCount++;
          }

          // 4. Dispatch email per recipient member
          if (emailEnabled && data.channels?.email !== false) {
            await enqueueEmail(
              {
                template: "system-alert",
                to: member.email,
                subject: data.title,
                tenantId: data.tenantId,
                idempotencyKey: `${job.id}:${member.userId}:email`,
                props: {
                  title: data.title,
                  message: data.message,
                  actionUrl: data.actionUrl,
                },
              },
              {
                jobId: `${job.id}:${member.userId}:email`,
              },
            );
            emailCount++;
          }
        }

        // 5. Batch insert in-app notifications idempotently
        if (inAppNotificationsToInsert.length > 0) {
          await db
            .insert(notification)
            .values(inAppNotificationsToInsert)
            .onConflictDoNothing();
        }

        console.log(
          `[Worker:Notification] Dispatched ${inAppCount} in-app and ${emailCount} email notifications for tenant ${data.tenantId}`,
        );
        return { dispatched: inAppCount + emailCount };
      }

      if (data.jobType === "system-notifications-fanout") {
        const systemRoles = data.systemRoles ?? ["admin", "staff"];

        // 1. Resolve active platform staff & admins
        const platformUsers = (
          await db.query.user.findMany({
            columns: { id: true, email: true, role: true },
            where: (table, { and, eq, inArray }) =>
              and(eq(table.status, "active"), inArray(table.role, systemRoles)),
          })
        ).map(({ id, email, role }) => ({ userId: id, email, role }));

        if (platformUsers.length === 0) {
          return { dispatched: 0 };
        }

        const userIds = platformUsers.map((u) => u.userId);
        const preferences = await db.query.notificationPreference.findMany({
          where: (preference, { inArray }) =>
            inArray(preference.userId, userIds),
        });

        const prefsMap = new Map(preferences.map((p) => [p.userId, p]));
        let inAppCount = 0;
        let emailCount = 0;
        const inAppNotificationsToInsert: (typeof notification.$inferInsert)[] =
          [];

        for (const pUser of platformUsers) {
          const pref = prefsMap.get(pUser.userId);

          if (pref?.mutedNotificationTypes?.includes(data.type)) {
            continue;
          }

          const inAppEnabled = pref?.enabledChannels
            ? pref.enabledChannels.includes("inApp")
            : true;
          const emailEnabled = pref?.enabledChannels
            ? pref.enabledChannels.includes("email")
            : true;

          // 2. Queue in-app notification row per platform user
          if (inAppEnabled && data.channels?.inApp !== false) {
            inAppNotificationsToInsert.push({
              userId: pUser.userId,
              tenantId: null,
              type: data.type,
              title: data.title,
              message: data.message,
              actionUrl: data.actionUrl ?? null,
              metadata: data.metadata ?? null,
              idempotencyKey: `${job.id}:${pUser.userId}:in-app`,
              isRead: false,
            });
            inAppCount++;
          }

          // 3. Dispatch email per platform user
          if (emailEnabled && data.channels?.email !== false) {
            await enqueueEmail(
              {
                template: "system-alert",
                to: pUser.email,
                subject: data.title,
                idempotencyKey: `${job.id}:${pUser.userId}:email`,
                props: {
                  title: data.title,
                  message: data.message,
                  actionUrl: data.actionUrl,
                },
              },
              {
                jobId: `${job.id}:${pUser.userId}:email`,
              },
            );
            emailCount++;
          }
        }

        // 4. Batch insert in-app notifications idempotently
        if (inAppNotificationsToInsert.length > 0) {
          await db
            .insert(notification)
            .values(inAppNotificationsToInsert)
            .onConflictDoNothing();
        }

        console.log(
          `[Worker:Notification] Dispatched ${inAppCount} in-app and ${emailCount} email notifications for system`,
        );
        return { dispatched: inAppCount + emailCount };
      }

      return { dispatched: 0 };
    },
    {
      connection: createRedisConnection(),
      concurrency: 5,
    },
  );

  worker.on("completed", (job) => {
    console.log(
      `[Worker:Notification] Fanout job ${job.id} completed successfully`,
    );
  });

  worker.on("failed", (job, err) => {
    console.error(
      `[Worker:Notification] Fanout job ${job?.id} failed with error:`,
      err,
    );
  });

  return worker;
}

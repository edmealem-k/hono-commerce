import { createServerApi } from "@/lib/api-server";
import { redirect } from "next/navigation";

import { WorkspaceHub } from "./workspace-hub";

import type { WorkspacesResponse } from "@/lib/queries/workspaces";

export default async function DashboardWorkspaceManager() {
  const api = await createServerApi();
  const response = await api.users.me.workspaces.$get();
  const responseStatus: number = response.status;
  if (responseStatus === 401) {
    redirect("/sign-in?callbackUrl=/");
  }
  if (responseStatus !== 200) {
    throw new Error("Unable to load the authenticated workspace manager");
  }
  const initialData: WorkspacesResponse | null = response.ok
    ? await response.json()
    : null;

  return <WorkspaceHub initialData={initialData} />;
}

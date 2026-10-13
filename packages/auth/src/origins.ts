export interface AuthOriginPolicyOptions {
  corsOrigins: string;
  dashboardUrl: string;
}

export interface AuthOriginPolicy {
  trustedOrigins: string[];
  isAllowed: (origin: string) => boolean;
}

export function createAuthOriginPolicy({
  corsOrigins,
  dashboardUrl,
}: AuthOriginPolicyOptions): AuthOriginPolicy {
  const dashboardOrigin = new URL(dashboardUrl);
  const explicitOrigins = corsOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => new URL(origin).origin);
  const dashboardWildcard = `${dashboardOrigin.protocol}//*.${dashboardOrigin.host}`;
  const trustedOrigins = [
    ...new Set([...explicitOrigins, dashboardOrigin.origin, dashboardWildcard]),
  ];

  return {
    trustedOrigins,
    isAllowed(origin) {
      let candidate: URL;
      try {
        candidate = new URL(origin);
      } catch {
        return false;
      }

      if (explicitOrigins.includes(candidate.origin)) {
        return true;
      }

      const isDashboardHost =
        candidate.hostname === dashboardOrigin.hostname ||
        candidate.hostname.endsWith(`.${dashboardOrigin.hostname}`);

      return (
        isDashboardHost &&
        candidate.protocol === dashboardOrigin.protocol &&
        candidate.port === dashboardOrigin.port
      );
    },
  };
}

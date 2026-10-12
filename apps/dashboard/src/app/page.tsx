import { createServerApi } from "@/lib/api-server";

import { WorkspaceHub } from "./workspace-hub";

import type { WorkspacesResponse } from "@/lib/queries/workspaces";

export default async function DashboardWorkspaceManager() {
  const api = await createServerApi();
  const response = await api.users.me.workspaces.$get();
  const initialData: WorkspacesResponse | null = response.ok
    ? await response.json()
    : null;

  return <WorkspaceHub initialData={initialData} />;
}

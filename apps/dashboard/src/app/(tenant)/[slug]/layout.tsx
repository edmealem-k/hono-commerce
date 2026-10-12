import { TenantWorkspaceShell } from "@/components/tenant-workspace-shell";
import { createServerApi } from "@/lib/api-server";
import { notFound, redirect } from "next/navigation";

export default async function TenantDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const api = await createServerApi();
  const response = await api.tenants[":tenantId"].workspace.$get({
    param: { tenantId: slug },
  });
  const responseStatus: number = response.status;

  if (responseStatus === 401) {
    redirect("/sign-in?callbackUrl=/");
  }

  if (responseStatus === 403 || responseStatus === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error("Unable to authorize the requested store workspace");
  }

  const workspace = (await response.json()).data;
  if (!workspace) {
    throw new Error("Store authorization response did not include data");
  }

  return (
    <TenantWorkspaceShell name={workspace.name} slug={workspace.slug}>
      {children}
    </TenantWorkspaceShell>
  );
}

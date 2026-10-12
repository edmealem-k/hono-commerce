import { TenantWorkspaceShell } from "@/components/tenant-workspace-shell";

export default async function TenantDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <TenantWorkspaceShell slug={slug}>{children}</TenantWorkspaceShell>;
}

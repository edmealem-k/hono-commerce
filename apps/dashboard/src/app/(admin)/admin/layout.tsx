import { AdminWorkspaceShell } from "@/components/admin-workspace-shell";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminWorkspaceShell>{children}</AdminWorkspaceShell>;
}

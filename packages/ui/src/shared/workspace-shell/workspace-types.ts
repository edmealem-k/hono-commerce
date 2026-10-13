import type { ReactNode } from "react";

export interface WorkspaceBreadcrumbItem {
  label: string;
  href?: string;
}

export interface WorkspaceHeaderProps {
  title: string;
  breadcrumbs?: readonly WorkspaceBreadcrumbItem[];
  leading?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

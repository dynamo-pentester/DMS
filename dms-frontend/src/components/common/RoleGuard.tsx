import { ReactNode } from "react";
import { usePermissions } from "@/contexts/PermissionContext";
import { Module, Action } from "@/utils/permissions";

interface RoleGuardProps {
  module: Module;
  action: Action;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ module, action, children, fallback = null }: RoleGuardProps) {
  const { can } = usePermissions();

  if (can(module, action)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

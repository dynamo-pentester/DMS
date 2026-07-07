import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { usePermissions } from "@/contexts/PermissionContext";
import type { Module } from "@/utils/permissions";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  /** Module to gate on. When omitted, only does auth check. */
  module?: Module;
  /** Page element to render when no module gate is needed inline */
  children?: ReactNode;
}

/**
 * ProtectedRoute operates in two modes:
 *
 * 1. **Auth guard** (no module, no children) — used as `<Route element={<ProtectedRoute />}>`.
 *    Renders `<Outlet />` if authenticated, redirects to /login otherwise.
 *
 * 2. **Module guard** (with module + children) — used as `<ProtectedRoute module="X"><Page /></ProtectedRoute>`.
 *    After auth passes, delegates to <ModuleGuard> which calls usePermissions()
 *    (safe because PermissionProvider is mounted above by AuthenticatedRoutes).
 */
export function ProtectedRoute({ module, children }: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isTokenExpired  = useAuthStore((s) => s.isTokenExpired);

  const expired = typeof isTokenExpired === "function" ? isTokenExpired() : false;

  if (!isAuthenticated || expired) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Module guard mode — safe because PermissionProvider is above in the tree
  if (module) {
    return <ModuleGuard module={module}>{children ?? <Outlet />}</ModuleGuard>;
  }

  // Auth-only mode — render children if provided (shouldn't happen), else Outlet
  return children ? <>{children}</> : <Outlet />;
}

/** Separate component so usePermissions() runs only inside the PermissionProvider tree */
function ModuleGuard({ module, children }: { module: Module; children: ReactNode }) {
  const { canAccessModule } = usePermissions();

  if (!canAccessModule(module)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

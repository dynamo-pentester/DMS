import { useAuthStore } from "../../store/authStore";

/**
 * Renders children only if the current user has one of the given roles.
 * Mirrors each controller's [Authorize(Roles = "...")] attribute so
 * buttons don't appear for actions that would 403 on the backend.
 *
 * <RoleGuard roles={MODULE_PERMISSIONS.DRIVERS_WRITE}>
 *   <button>Create Driver</button>
 * </RoleGuard>
 */
export default function RoleGuard({ roles = [], children, fallback = null }) {
  const hasRole = useAuthStore((s) => s.hasRole);
  if (roles.length === 0 || hasRole(...roles)) {
    return children;
  }
  return fallback;
}

import { Navigate, Outlet } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAppSelector } from '@/store/hooks';
import { selectAuthRoles } from '@/features/auth/authSlice';

interface RoleRouteProps {
  allowedRoles: string[];
}

/**
 * Gate for role-restricted routes/actions, mirroring each controller's
 * [Authorize(Roles = "...")] attribute exactly (e.g. Driver create/update is
 * "System Administrator,HR Executive" - see DriversController.cs). This is a
 * UX guard only; the backend is still the actual enforcement boundary.
 */
export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const roles = useAppSelector(selectAuthRoles);
  const allowed = roles.some((r) => allowedRoles.includes(r));

  if (!allowed) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 1.5 }}>
        <LockOutlinedIcon sx={{ fontSize: 36, color: 'text.secondary' }} />
        <Typography variant="h3">You don't have access to this page</Typography>
        <Typography variant="body2" color="text.secondary">
          This action requires one of: {allowedRoles.join(', ')}
        </Typography>
      </Box>
    );
  }
  return <Outlet />;
}

/** Non-route helper for hiding buttons/actions inline (e.g. a Delete button). */
export function useHasRole(allowedRoles: string[]): boolean {
  const roles = useAppSelector(selectAuthRoles);
  return roles.some((r) => allowedRoles.includes(r));
}

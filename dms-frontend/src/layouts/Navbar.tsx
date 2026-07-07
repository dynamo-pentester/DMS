import { useEffect, useState } from 'react';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import Brightness4OutlinedIcon from '@mui/icons-material/Brightness4Outlined';
import Brightness7OutlinedIcon from '@mui/icons-material/Brightness7Outlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout, selectCurrentUser } from '@/features/auth/authSlice';
import { useThemeMode } from '@/theme/ThemeModeContext';
import { ROUTES } from '@/constants/routes';
import { searchNotifications } from '@/features/notifications/notificationsSlice';

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Navbar() {
  const user = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { mode, toggleMode } = useThemeMode();
  const pendingCount = useAppSelector((state) => state.notifications.items.filter((item) => item.statusName === 'Pending').length);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    dispatch(searchNotifications({ status: 'Pending', page: 1, pageSize: 100 }));
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ justifyContent: 'flex-end', gap: 1 }}>
        <Tooltip title="Toggle dark mode">
          <IconButton onClick={toggleMode} size="small">
            {mode === 'dark' ? <Brightness7OutlinedIcon /> : <Brightness4OutlinedIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Notifications">
          <IconButton size="small" onClick={() => navigate(ROUTES.NOTIFICATIONS)}>
            <Badge badgeContent={pendingCount} color="error" max={99}>
              <NotificationsNoneOutlinedIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ my: 1, mx: 0.5 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={(e) => setAnchorEl(e.currentTarget)}>
          <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'primary.main' }}>
            {user ? initials(user.fullName) : '?'}
          </Avatar>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {user?.fullName ?? 'Unknown user'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.roles?.[0] ?? ''}
            </Typography>
          </Box>
        </Box>
        <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutOutlinedIcon fontSize="small" />
            </ListItemIcon>
            Sign out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

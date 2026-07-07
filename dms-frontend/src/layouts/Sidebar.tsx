import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAV_ITEMS } from './navConfig';
import { useAppSelector } from '@/store/hooks';
import { selectAuthRoles } from '@/features/auth/authSlice';

export const SIDEBAR_WIDTH = 240;

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const roles = useAppSelector(selectAuthRoles);

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.allowedRoles || item.allowedRoles.some((r) => roles.includes(r))
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box' },
      }}
    >
      <Box sx={{ px: 2.5, py: 2.5 }}>
        <Typography variant="subtitle1" sx={{ color: '#fff', lineHeight: 1.2 }}>
          Driver Management
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.6 }}>
          System
        </Typography>
      </Box>
      <List sx={{ px: 1 }}>
        {visibleNavItems.map((item) => {
          const selected = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <ListItemButton
              key={item.path}
              selected={selected}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 1,
                mb: 0.25,
                color: selected ? '#fff' : 'inherit',
                bgcolor: selected ? 'rgba(255,255,255,0.08)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.10)' },
              }}
            >
              <ListItemIcon sx={{ color: selected ? '#fff' : 'inherit', minWidth: 36 }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: selected ? 600 : 500 }}>
                {item.label}
              </ListItemText>
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}

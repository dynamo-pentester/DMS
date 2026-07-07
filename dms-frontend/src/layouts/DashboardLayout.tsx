import { useEffect } from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAllLookups } from '@/features/lookups/lookupsSlice';

export function DashboardLayout() {
  const dispatch = useAppDispatch();
  const lookupsLoaded = useAppSelector((s) => s.lookups.loaded);

  // Reference data is fetched once per session here rather than per-form, so
  // every create/edit dialog opens instantly with dropdowns already populated.
  useEffect(() => {
    if (!lookupsLoaded) {
      dispatch(fetchAllLookups());
    }
  }, [dispatch, lookupsLoaded]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

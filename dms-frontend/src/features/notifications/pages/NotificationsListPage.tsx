import { useEffect, useState } from 'react';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { toast } from 'react-toastify';
import DoneIcon from '@mui/icons-material/Done';
import { PageHeader } from '@/components/PageHeader';
import { ServerDataGrid } from '@/components/ServerDataGrid';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { searchNotifications, dismissNotification } from '../notificationsSlice';
import { formatDateTime, formatDate } from '@/utils/dateUtils';
import { useHasRole } from '@/components/RoleRoute';
import { MODULE_PERMISSIONS } from '@/config/rbac';

export default function NotificationsListPage() {
  const dispatch = useAppDispatch();
  const { items, totalCount, loading } = useAppSelector((s) => s.notifications);
  const canEdit = useHasRole(MODULE_PERMISSIONS.notifications.write);

  const [status, setStatus] = useState<string>('Pending');
  const [entityType, setEntityType] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchNotifications = () => {
    dispatch(
      searchNotifications({
        status: status || undefined,
        entityType: entityType || undefined,
        page,
        pageSize,
      })
    );
  };

  useEffect(() => {
    fetchNotifications();
  }, [dispatch, status, entityType, page, pageSize]);

  const handleDismiss = async (id: number) => {
    try {
      await dispatch(dismissNotification(id)).unwrap();
      toast.success('Notification dismissed');
      fetchNotifications();
    } catch (err: any) {
      toast.error(err || 'Failed to dismiss notification');
    }
  };

  const columns: GridColDef[] = [
    { 
      field: 'createdAt', 
      headerName: 'Created At', 
      width: 150,
      renderCell: (params) => formatDateTime(params.value as string)
    },
    { field: 'entityTypeName', headerName: 'Entity Type', width: 130 },
    { field: 'title', headerName: 'Title', width: 250 },
    { field: 'message', headerName: 'Message', flex: 1, minWidth: 200 },
    { 
      field: 'dueDate', 
      headerName: 'Due Date', 
      width: 120,
      renderCell: (params) => formatDate(params.value as string)
    },
    {
      field: 'statusName',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" color={params.value === 'Pending' ? 'warning.main' : 'text.secondary'}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => {
        if (params.row.statusName !== 'Pending' || !canEdit) return null;
        return (
          <Button
            size="small"
            startIcon={<DoneIcon />}
            onClick={() => handleDismiss(params.row.notificationId)}
          >
            Dismiss
          </Button>
        );
      },
    }
  ];

  return (
    <Box>
      <PageHeader title="Notifications" />

      <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          sx={{ width: 150 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="Pending">Pending</MenuItem>
          <MenuItem value="Dismissed">Dismissed</MenuItem>
        </TextField>
        
        <TextField
          select
          size="small"
          label="Entity Type"
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(1);
          }}
          sx={{ width: 150 }}
        >
          <MenuItem value="">All Entities</MenuItem>
          <MenuItem value="Driver">Driver</MenuItem>
          <MenuItem value="License">License</MenuItem>
          <MenuItem value="MedicalRecord">Medical Record</MenuItem>
          <MenuItem value="Training">Training</MenuItem>
          <MenuItem value="Transporter">Transporter</MenuItem>
        </TextField>
      </Stack>

      <ServerDataGrid
        rows={items}
        columns={columns}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        loading={loading}
        getRowId={(row) => row.notificationId}
        onPageChange={(p, pz) => {
          setPage(p);
          setPageSize(pz);
        }}
      />
    </Box>
  );
}

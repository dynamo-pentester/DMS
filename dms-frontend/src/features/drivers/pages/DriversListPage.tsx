import { useEffect, useState } from 'react';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '@/components/PageHeader';
import { ServerDataGrid } from '@/components/ServerDataGrid';
import { StatusChip } from '@/components/StatusChip';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { searchDrivers } from '../driversSlice';
import { ROUTES } from '@/constants/routes';
import { useHasRole } from '@/components/RoleRoute';
import { MODULE_PERMISSIONS } from '@/config/rbac';

export default function DriversListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, totalCount, loading } = useAppSelector((s) => s.drivers);
  const driverStatusTypes = useAppSelector((s) => s.lookups.driverStatusTypes);
  const canCreate = useHasRole(MODULE_PERMISSIONS.drivers.write);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusId, setStatusId] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    dispatch(
      searchDrivers({
        searchTerm: searchTerm || undefined,
        statusId: statusId || undefined,
        page,
        pageSize,
      })
    );
  }, [dispatch, searchTerm, statusId, page, pageSize]);

  const columns: GridColDef[] = [
    { field: 'driverCode', headerName: 'Code', width: 120 },
    { field: 'fullName', headerName: 'Name', flex: 1, minWidth: 200 },
    { field: 'mobile', headerName: 'Mobile', width: 150 },
    { field: 'currentTransporterName', headerName: 'Transporter', flex: 1, minWidth: 200 },
    {
      field: 'currentStatusName',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => <StatusChip status={params.value as string} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Drivers"
        actions={
          canCreate ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(ROUTES.DRIVER_NEW)}
            >
              Add Driver
            </Button>
          ) : undefined
        }
      />

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search by code, name, or mobile…"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          sx={{ width: 300 }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={statusId}
          onChange={(e) => {
            setStatusId(e.target.value as number | '');
            setPage(1);
          }}
          sx={{ width: 200 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          {driverStatusTypes.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <ServerDataGrid
        rows={items}
        columns={columns}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        loading={loading}
        getRowId={(row) => row.driverId}
        onPageChange={(p, pz) => {
          setPage(p);
          setPageSize(pz);
        }}
        onRowClick={(row) => navigate(ROUTES.DRIVER_DETAILS(row.driverId))}
      />
    </Box>
  );
}

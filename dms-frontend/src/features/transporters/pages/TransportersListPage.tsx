import { useEffect, useState } from 'react';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '@/components/PageHeader';
import { ServerDataGrid } from '@/components/ServerDataGrid';
import { StatusChip } from '@/components/StatusChip';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { searchTransporters } from '../transportersSlice';
import { ROUTES } from '@/constants/routes';
import { useHasRole } from '@/components/RoleRoute';
import { MODULE_PERMISSIONS } from '@/config/rbac';

export default function TransportersListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, totalCount, loading } = useAppSelector((s) => s.transporters);
  const canEdit = useHasRole(MODULE_PERMISSIONS.transporters.write);

  const [searchTerm, setSearchTerm] = useState('');
  const [isActive, setIsActive] = useState<string>('true');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    dispatch(
      searchTransporters({
        searchTerm: searchTerm || undefined,
        isActive: isActive === '' ? undefined : isActive === 'true',
        page,
        pageSize,
      })
    );
  }, [dispatch, searchTerm, isActive, page, pageSize]);

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Transporter Name', flex: 1, minWidth: 200 },
    { field: 'contactPerson', headerName: 'Contact Person', width: 150 },
    { field: 'mobile', headerName: 'Mobile', width: 150 },
    { field: 'currentDriverCount', headerName: 'Drivers Assigned', width: 150, type: 'number' },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => <StatusChip status={params.value ? 'Active' : 'Inactive'} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Transporters"
        actions={
          canEdit ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(ROUTES.TRANSPORTER_NEW)}
            >
              Add Transporter
            </Button>
          ) : undefined
        }
      />

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search by name, contact, or mobile…"
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
          value={isActive}
          onChange={(e) => {
            setIsActive(e.target.value);
            setPage(1);
          }}
          sx={{ width: 200 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="true">Active</MenuItem>
          <MenuItem value="false">Inactive</MenuItem>
        </TextField>
      </Stack>

      <ServerDataGrid
        rows={items}
        columns={columns}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        loading={loading}
        getRowId={(row) => row.transporterId}
        onPageChange={(p, pz) => {
          setPage(p);
          setPageSize(pz);
        }}
        onRowClick={(row) => navigate(ROUTES.TRANSPORTER_DETAILS(row.transporterId))}
      />
    </Box>
  );
}

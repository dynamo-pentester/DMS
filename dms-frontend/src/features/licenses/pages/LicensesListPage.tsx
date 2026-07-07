import { useEffect, useState } from 'react';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '@/components/PageHeader';
import { ServerDataGrid } from '@/components/ServerDataGrid';
import { StatusChip } from '@/components/StatusChip';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { searchLicenses } from '../licensesSlice';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/utils/dateUtils';
import { useHasRole } from '@/components/RoleRoute';
import { MODULE_PERMISSIONS } from '@/config/rbac';

export default function LicensesListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, totalCount, loading } = useAppSelector((s) => s.licenses);
  const canEdit = useHasRole(MODULE_PERMISSIONS.licenses.write);

  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    dispatch(
      searchLicenses({
        status: status || undefined,
        page,
        pageSize,
      })
    );
  }, [dispatch, status, page, pageSize]);

  const columns: GridColDef[] = [
    { field: 'licenseNo', headerName: 'License Number', width: 150 },
    { field: 'driverName', headerName: 'Driver Name', flex: 1, minWidth: 200 },
    { field: 'vehicleTypeName', headerName: 'Vehicle Type', width: 150 },
    { 
      field: 'validTill', 
      headerName: 'Valid Till', 
      width: 150,
      renderCell: (params) => formatDate(params.value as string)
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => <StatusChip status={params.value as string} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Licenses"
        actions={
          canEdit ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(ROUTES.LICENSE_NEW)}
            >
              Add License
            </Button>
          ) : undefined
        }
      />

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          select
          size="small"
          label="Status Filter"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          sx={{ width: 200 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="Valid">Valid</MenuItem>
          <MenuItem value="Expiring">Expiring</MenuItem>
          <MenuItem value="Expired">Expired</MenuItem>
        </TextField>
      </Stack>

      <ServerDataGrid
        rows={items}
        columns={columns}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        loading={loading}
        getRowId={(row) => row.licenseId}
        onPageChange={(p, pz) => {
          setPage(p);
          setPageSize(pz);
        }}
        onRowClick={canEdit ? (row) => navigate(ROUTES.LICENSE_EDIT(row.licenseId)) : undefined}
      />
    </Box>
  );
}

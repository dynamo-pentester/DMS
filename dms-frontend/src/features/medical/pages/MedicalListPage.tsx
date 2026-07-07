import { useEffect, useState } from 'react';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '@/components/PageHeader';
import { ServerDataGrid } from '@/components/ServerDataGrid';
import { StatusChip } from '@/components/StatusChip';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { searchMedicalRecords } from '../medicalSlice';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/utils/dateUtils';
import { useHasRole } from '@/components/RoleRoute';
import { MODULE_PERMISSIONS } from '@/config/rbac';

export default function MedicalListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, totalCount, loading } = useAppSelector((s) => s.medical);
  const canEdit = useHasRole(MODULE_PERMISSIONS.medical.write);

  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    dispatch(
      searchMedicalRecords({
        status: status || undefined,
        page,
        pageSize,
      })
    );
  }, [dispatch, status, page, pageSize]);

  const columns: GridColDef[] = [
    { field: 'driverName', headerName: 'Driver Name', flex: 1, minWidth: 200 },
    { field: 'fitnessStatusName', headerName: 'Fitness Status', width: 150 },
    { 
      field: 'examDate', 
      headerName: 'Exam Date', 
      width: 120,
      renderCell: (params) => formatDate(params.value as string)
    },
    { 
      field: 'validTill', 
      headerName: 'Valid Till', 
      width: 120,
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
        title="Medical Records"
        actions={
          canEdit ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(ROUTES.MEDICAL_NEW)}
            >
              Add Medical Record
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
        getRowId={(row) => row.medicalRecordId}
        onPageChange={(p, pz) => {
          setPage(p);
          setPageSize(pz);
        }}
        onRowClick={canEdit ? (row) => navigate(ROUTES.MEDICAL_EDIT(row.medicalRecordId)) : undefined}
      />
    </Box>
  );
}

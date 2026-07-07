import { useEffect, useState } from 'react';
import { Box, Button, FormControlLabel, Stack, Switch } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { GridColDef } from '@mui/x-data-grid';
import { toast } from 'react-toastify';
import { PageHeader } from '@/components/PageHeader';
import { ServerDataGrid } from '@/components/ServerDataGrid';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { searchPlantMovements, recordExit } from '../plantMovementsSlice';
import { ROUTES } from '@/constants/routes';
import { formatDateTime } from '@/utils/dateUtils';
import { useHasRole } from '@/components/RoleRoute';
import { MODULE_PERMISSIONS } from '@/config/rbac';

export default function PlantMovementsListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, totalCount, loading } = useAppSelector((s) => s.plantMovements);
  const canEdit = useHasRole(MODULE_PERMISSIONS.plantMovements.write);

  const [onSiteOnly, setOnSiteOnly] = useState<boolean>(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchMovements = () => {
    dispatch(
      searchPlantMovements({
        onSiteOnly: onSiteOnly ? true : undefined,
        page,
        pageSize,
      })
    );
  };

  useEffect(() => {
    fetchMovements();
  }, [dispatch, onSiteOnly, page, pageSize]);

  const handleRecordExit = async (id: number) => {
    try {
      await dispatch(recordExit({ id, data: { dateOfExit: null } })).unwrap();
      toast.success('Exit recorded successfully');
      fetchMovements();
    } catch (err: any) {
      toast.error(err || 'Failed to record exit');
    }
  };

  const columns: GridColDef[] = [
    { field: 'driverName', headerName: 'Driver Name', flex: 1, minWidth: 200 },
    { field: 'vehicleNo', headerName: 'Vehicle No', width: 150 },
    { field: 'gateNumberName', headerName: 'Gate', width: 120 },
    { field: 'purposeTypeName', headerName: 'Purpose', width: 150 },
    { 
      field: 'dateOfEntry', 
      headerName: 'Entry Time', 
      width: 180,
      renderCell: (params) => formatDateTime(params.value as string)
    },
    { 
      field: 'dateOfExit', 
      headerName: 'Exit Time', 
      width: 180,
      renderCell: (params) => params.value ? formatDateTime(params.value as string) : '—'
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => {
        if (!params.row.isOnSite || !canEdit) return null;
        return (
          <Button
            size="small"
            startIcon={<ExitToAppIcon />}
            onClick={(e) => {
              e.stopPropagation(); // prevent row click
              handleRecordExit(params.row.movementId);
            }}
          >
            Record Exit
          </Button>
        );
      },
    }
  ];

  return (
    <Box>
      <PageHeader
        title="Plant Movements"
        actions={
          canEdit ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(ROUTES.PLANT_MOVEMENT_NEW)}
            >
              Record Entry
            </Button>
          ) : undefined
        }
      />

      <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
        <FormControlLabel
          control={<Switch checked={onSiteOnly} onChange={(e) => { setOnSiteOnly(e.target.checked); setPage(1); }} />}
          label="Currently On-Site Only"
        />
      </Stack>

      <ServerDataGrid
        rows={items}
        columns={columns}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        loading={loading}
        getRowId={(row) => row.movementId}
        onPageChange={(p, pz) => {
          setPage(p);
          setPageSize(pz);
        }}
      />
    </Box>
  );
}

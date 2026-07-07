import { useEffect, useState } from 'react';
import { Box, Button, FormControlLabel, MenuItem, Stack, Switch, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '@/components/PageHeader';
import { ServerDataGrid } from '@/components/ServerDataGrid';
import { StatusChip } from '@/components/StatusChip';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { searchIncidents } from '../incidentsSlice';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/utils/dateUtils';
import { useHasRole } from '@/components/RoleRoute';
import { MODULE_PERMISSIONS } from '@/config/rbac';

export default function IncidentsListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, totalCount, loading } = useAppSelector((s) => s.incidents);
  const severityLevels = useAppSelector((s) => s.lookups.severityLevels);
  const canEdit = useHasRole(MODULE_PERMISSIONS.incidents.write);

  const [severityLevelId, setSeverityLevelId] = useState<number | ''>('');
  const [rootCauseCompleted, setRootCauseCompleted] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    dispatch(
      searchIncidents({
        severityLevelId: severityLevelId || undefined,
        rootCauseCompleted: rootCauseCompleted ? true : undefined,
        page,
        pageSize,
      })
    );
  }, [dispatch, severityLevelId, rootCauseCompleted, page, pageSize]);

  const columns: GridColDef[] = [
    { field: 'incidentDate', headerName: 'Date', width: 120, renderCell: (params) => formatDate(params.value as string) },
    { field: 'driverName', headerName: 'Driver Name', flex: 1, minWidth: 200 },
    { field: 'incidentTypeName', headerName: 'Incident Type', width: 200 },
    { field: 'severityLevelName', headerName: 'Severity', width: 150 },
    { field: 'rootCauseCompleted', headerName: 'Root Cause Complete', width: 180, type: 'boolean' },
  ];

  return (
    <Box>
      <PageHeader
        title="Incidents"
        actions={
          canEdit ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(ROUTES.INCIDENT_NEW)}
            >
              Report Incident
            </Button>
          ) : undefined
        }
      />

      <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
        <TextField
          select
          size="small"
          label="Severity Filter"
          value={severityLevelId}
          onChange={(e) => {
            setSeverityLevelId(e.target.value as number | '');
            setPage(1);
          }}
          sx={{ width: 200 }}
        >
          <MenuItem value="">All Severities</MenuItem>
          {severityLevels.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>
        
        <FormControlLabel
          control={<Switch checked={rootCauseCompleted} onChange={(e) => { setRootCauseCompleted(e.target.checked); setPage(1); }} />}
          label="Root Cause Completed Only"
        />
      </Stack>

      <ServerDataGrid
        rows={items}
        columns={columns}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        loading={loading}
        getRowId={(row) => row.incidentId}
        onPageChange={(p, pz) => {
          setPage(p);
          setPageSize(pz);
        }}
        onRowClick={(row) => navigate(ROUTES.INCIDENT_DETAILS(row.incidentId))}
      />
    </Box>
  );
}

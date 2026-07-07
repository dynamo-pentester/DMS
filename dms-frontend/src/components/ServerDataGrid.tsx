import { Box, Paper } from '@mui/material';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';

interface ServerDataGridProps<T> {
  rows: T[];
  columns: GridColDef[];
  totalCount: number;
  page: number; // 1-based, matches backend PagedResult.Page
  pageSize: number;
  loading: boolean;
  getRowId: (row: T) => number;
  onPageChange: (page: number, pageSize: number) => void;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * Thin wrapper around MUI DataGrid configured for server-side pagination
 * against DriverDms.Application.DTOs.PagedResult<T> - every list page
 * (Drivers, Licenses, Medical, Trainings, Incidents, PlantMovements,
 * Transporters, Notifications) uses this exact component so paging,
 * loading, and empty states behave identically everywhere.
 */
export function ServerDataGrid<T>({
  rows,
  columns,
  totalCount,
  page,
  pageSize,
  loading,
  getRowId,
  onPageChange,
  onRowClick,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your filters or search term.',
}: ServerDataGridProps<T>) {
  const paginationModel: GridPaginationModel = { page: page - 1, pageSize };

  if (!loading && rows.length === 0) {
    return (
      <Paper>
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%' }}>
      <Box sx={{ height: 'calc(100vh - 320px)', minHeight: 420 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={getRowId}
          loading={loading}
          rowCount={totalCount}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={(m) => onPageChange(m.page + 1, m.pageSize)}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          onRowClick={onRowClick ? (params) => onRowClick(params.row as T) : undefined}
          sx={{
            border: 'none',
            '& .MuiDataGrid-row': { cursor: onRowClick ? 'pointer' : 'default' },
            '& .MuiDataGrid-columnHeaders': { backgroundColor: 'action.hover' },
          }}
          slots={{ loadingOverlay: () => <LoadingState label="Loading records…" /> }}
        />
      </Box>
    </Paper>
  );
}

import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { incidentsService } from './incidentsService';
import {
  IncidentDto,
  CreateIncidentRequest,
  UpdateIncidentRequest,
  IncidentSearchRequest,
  AddCorrectiveActionRequest,
} from './types';

interface IncidentsState {
  items: IncidentDto[];
  totalCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: IncidentsState = {
  items: [],
  totalCount: 0,
  loading: false,
  error: null,
};

export const searchIncidents = createAsyncThunk(
  'incidents/search',
  async (params: IncidentSearchRequest) => await incidentsService.search(params)
);

export const getIncident = createAsyncThunk(
  'incidents/getById',
  async (id: number) => await incidentsService.getById(id)
);

export const createIncident = createAsyncThunk(
  'incidents/create',
  async (data: CreateIncidentRequest) => await incidentsService.create(data)
);

export const updateIncident = createAsyncThunk(
  'incidents/update',
  async ({ id, data }: { id: number; data: UpdateIncidentRequest }) => await incidentsService.update(id, data)
);

export const deleteIncident = createAsyncThunk(
  'incidents/delete',
  async (id: number) => {
    await incidentsService.delete(id);
    return id;
  }
);

export const addCorrectiveAction = createAsyncThunk(
  'incidents/addCorrectiveAction',
  async ({ incidentId, data }: { incidentId: number; data: AddCorrectiveActionRequest }) =>
    await incidentsService.addCorrectiveAction(incidentId, data)
);

const incidentsSlice = createSlice({
  name: 'incidents',
  initialState,
  reducers: {
    clearIncidentsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchIncidents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchIncidents.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.totalCount = action.payload.totalCount;
        state.loading = false;
      })
      .addCase(searchIncidents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load incidents';
      });
  },
});

export const { clearIncidentsError } = incidentsSlice.actions;
export default incidentsSlice.reducer;

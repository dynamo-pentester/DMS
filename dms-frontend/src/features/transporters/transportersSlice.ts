import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { transportersService } from './transportersService';
import {
  TransporterDto,
  CreateTransporterRequest,
  UpdateTransporterRequest,
  TransporterSearchRequest,
  AssignDriverRequest,
} from './types';

interface TransportersState {
  items: TransporterDto[];
  totalCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: TransportersState = {
  items: [],
  totalCount: 0,
  loading: false,
  error: null,
};

export const searchTransporters = createAsyncThunk(
  'transporters/search',
  async (params: TransporterSearchRequest) => await transportersService.search(params)
);

export const getTransporter = createAsyncThunk(
  'transporters/getById',
  async (id: number) => await transportersService.getById(id)
);

export const createTransporter = createAsyncThunk(
  'transporters/create',
  async (data: CreateTransporterRequest) => await transportersService.create(data)
);

export const updateTransporter = createAsyncThunk(
  'transporters/update',
  async ({ id, data }: { id: number; data: UpdateTransporterRequest }) => await transportersService.update(id, data)
);

export const deleteTransporter = createAsyncThunk(
  'transporters/delete',
  async (id: number) => {
    await transportersService.delete(id);
    return id;
  }
);

export const getAssignmentHistory = createAsyncThunk(
  'transporters/getAssignmentHistory',
  async (id: number) => await transportersService.getAssignmentHistory(id)
);

export const assignDriver = createAsyncThunk(
  'transporters/assignDriver',
  async ({ id, data }: { id: number; data: AssignDriverRequest }) => await transportersService.assignDriver(id, data)
);

export const unassignDriver = createAsyncThunk(
  'transporters/unassignDriver',
  async ({ id, driverId }: { id: number; driverId: number }) => await transportersService.unassignDriver(id, driverId)
);

const transportersSlice = createSlice({
  name: 'transporters',
  initialState,
  reducers: {
    clearTransportersError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchTransporters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchTransporters.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.totalCount = action.payload.totalCount;
        state.loading = false;
      })
      .addCase(searchTransporters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load transporters';
      });
  },
});

export const { clearTransportersError } = transportersSlice.actions;
export default transportersSlice.reducer;

import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { driversService } from './driversService';
import {
  DriverDto,
  CreateDriverRequest,
  UpdateDriverRequest,
  DriverSearchRequest,
  UpdateDriverStatusRequest,
} from './types';

interface DriversState {
  items: DriverDto[];
  totalCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: DriversState = {
  items: [],
  totalCount: 0,
  loading: false,
  error: null,
};

export const searchDrivers = createAsyncThunk(
  'drivers/search',
  async (params: DriverSearchRequest) => await driversService.search(params)
);

export const getDriver = createAsyncThunk(
  'drivers/getById',
  async (id: number) => await driversService.getById(id)
);

export const createDriver = createAsyncThunk(
  'drivers/create',
  async (data: CreateDriverRequest) => await driversService.create(data)
);

export const updateDriver = createAsyncThunk(
  'drivers/update',
  async ({ id, data }: { id: number; data: UpdateDriverRequest }) => await driversService.update(id, data)
);

export const changeDriverStatus = createAsyncThunk(
  'drivers/updateStatus',
  async ({ id, data }: { id: number; data: UpdateDriverStatusRequest }) => {
    await driversService.updateStatus(id, data);
    return { id, data };
  }
);

export const deleteDriver = createAsyncThunk(
  'drivers/delete',
  async (id: number) => {
    await driversService.delete(id);
    return id;
  }
);

const driversSlice = createSlice({
  name: 'drivers',
  initialState,
  reducers: {
    clearDriversError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchDrivers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchDrivers.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.totalCount = action.payload.totalCount;
        state.loading = false;
      })
      .addCase(searchDrivers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load drivers';
      });
  },
});

export const { clearDriversError } = driversSlice.actions;
export default driversSlice.reducer;

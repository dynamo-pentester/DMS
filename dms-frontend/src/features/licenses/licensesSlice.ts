import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { licensesService } from './licensesService';
import {
  LicenseDto,
  CreateLicenseRequest,
  UpdateLicenseRequest,
  LicenseSearchRequest,
} from './types';

interface LicensesState {
  items: LicenseDto[];
  totalCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: LicensesState = {
  items: [],
  totalCount: 0,
  loading: false,
  error: null,
};

export const searchLicenses = createAsyncThunk(
  'licenses/search',
  async (params: LicenseSearchRequest) => await licensesService.search(params)
);

export const getLicense = createAsyncThunk(
  'licenses/getById',
  async (id: number) => await licensesService.getById(id)
);

export const createLicense = createAsyncThunk(
  'licenses/create',
  async (data: CreateLicenseRequest) => await licensesService.create(data)
);

export const updateLicense = createAsyncThunk(
  'licenses/update',
  async ({ id, data }: { id: number; data: UpdateLicenseRequest }) => await licensesService.update(id, data)
);

export const deleteLicense = createAsyncThunk(
  'licenses/delete',
  async (id: number) => {
    await licensesService.delete(id);
    return id;
  }
);

const licensesSlice = createSlice({
  name: 'licenses',
  initialState,
  reducers: {
    clearLicensesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchLicenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchLicenses.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.totalCount = action.payload.totalCount;
        state.loading = false;
      })
      .addCase(searchLicenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load licenses';
      });
  },
});

export const { clearLicensesError } = licensesSlice.actions;
export default licensesSlice.reducer;

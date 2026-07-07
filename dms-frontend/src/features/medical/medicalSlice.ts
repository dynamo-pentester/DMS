import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { medicalService } from './medicalService';
import {
  MedicalRecordDto,
  CreateMedicalRecordRequest,
  UpdateMedicalRecordRequest,
  MedicalRecordSearchRequest,
} from './types';

interface MedicalRecordsState {
  items: MedicalRecordDto[];
  totalCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: MedicalRecordsState = {
  items: [],
  totalCount: 0,
  loading: false,
  error: null,
};

export const searchMedicalRecords = createAsyncThunk(
  'medical/search',
  async (params: MedicalRecordSearchRequest) => await medicalService.search(params)
);

export const getMedicalRecord = createAsyncThunk(
  'medical/getById',
  async (id: number) => await medicalService.getById(id)
);

export const createMedicalRecord = createAsyncThunk(
  'medical/create',
  async (data: CreateMedicalRecordRequest) => await medicalService.create(data)
);

export const updateMedicalRecord = createAsyncThunk(
  'medical/update',
  async ({ id, data }: { id: number; data: UpdateMedicalRecordRequest }) => await medicalService.update(id, data)
);

export const deleteMedicalRecord = createAsyncThunk(
  'medical/delete',
  async (id: number) => {
    await medicalService.delete(id);
    return id;
  }
);

const medicalSlice = createSlice({
  name: 'medical',
  initialState,
  reducers: {
    clearMedicalError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchMedicalRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchMedicalRecords.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.totalCount = action.payload.totalCount;
        state.loading = false;
      })
      .addCase(searchMedicalRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load medical records';
      });
  },
});

export const { clearMedicalError } = medicalSlice.actions;
export default medicalSlice.reducer;

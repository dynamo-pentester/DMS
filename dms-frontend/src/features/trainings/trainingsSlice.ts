import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { trainingsService } from './trainingsService';
import {
  TrainingDto,
  CreateTrainingRequest,
  UpdateTrainingRequest,
  TrainingSearchRequest,
} from './types';

interface TrainingsState {
  items: TrainingDto[];
  totalCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: TrainingsState = {
  items: [],
  totalCount: 0,
  loading: false,
  error: null,
};

export const searchTrainings = createAsyncThunk(
  'trainings/search',
  async (params: TrainingSearchRequest) => await trainingsService.search(params)
);

export const getTraining = createAsyncThunk(
  'trainings/getById',
  async (id: number) => await trainingsService.getById(id)
);

export const createTraining = createAsyncThunk(
  'trainings/create',
  async (data: CreateTrainingRequest) => await trainingsService.create(data)
);

export const updateTraining = createAsyncThunk(
  'trainings/update',
  async ({ id, data }: { id: number; data: UpdateTrainingRequest }) => await trainingsService.update(id, data)
);

export const deleteTraining = createAsyncThunk(
  'trainings/delete',
  async (id: number) => {
    await trainingsService.delete(id);
    return id;
  }
);

const trainingsSlice = createSlice({
  name: 'trainings',
  initialState,
  reducers: {
    clearTrainingsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchTrainings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchTrainings.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.totalCount = action.payload.totalCount;
        state.loading = false;
      })
      .addCase(searchTrainings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load trainings';
      });
  },
});

export const { clearTrainingsError } = trainingsSlice.actions;
export default trainingsSlice.reducer;

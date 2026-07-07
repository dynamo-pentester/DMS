import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { plantMovementsService } from './plantMovementsService';
import {
  PlantMovementDto,
  CreatePlantMovementRequest,
  RecordExitRequest,
  PlantMovementSearchRequest,
} from './types';

interface PlantMovementsState {
  items: PlantMovementDto[];
  totalCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: PlantMovementsState = {
  items: [],
  totalCount: 0,
  loading: false,
  error: null,
};

export const searchPlantMovements = createAsyncThunk(
  'plantMovements/search',
  async (params: PlantMovementSearchRequest) => await plantMovementsService.search(params)
);

export const getPlantMovement = createAsyncThunk(
  'plantMovements/getById',
  async (id: number) => await plantMovementsService.getById(id)
);

export const recordEntry = createAsyncThunk(
  'plantMovements/recordEntry',
  async (data: CreatePlantMovementRequest) => await plantMovementsService.recordEntry(data)
);

export const recordExit = createAsyncThunk(
  'plantMovements/recordExit',
  async ({ id, data }: { id: number; data: RecordExitRequest }) => await plantMovementsService.recordExit(id, data)
);

const plantMovementsSlice = createSlice({
  name: 'plantMovements',
  initialState,
  reducers: {
    clearPlantMovementsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchPlantMovements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchPlantMovements.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.totalCount = action.payload.totalCount;
        state.loading = false;
      })
      .addCase(searchPlantMovements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load plant movements';
      });
  },
});

export const { clearPlantMovementsError } = plantMovementsSlice.actions;
export default plantMovementsSlice.reducer;

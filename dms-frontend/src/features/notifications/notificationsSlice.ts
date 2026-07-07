import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { notificationsService } from './notificationsService';
import { NotificationDto, NotificationSearchRequest } from './types';

interface NotificationsState {
  items: NotificationDto[];
  totalCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  items: [],
  totalCount: 0,
  loading: false,
  error: null,
};

export const searchNotifications = createAsyncThunk(
  'notifications/search',
  async (params: NotificationSearchRequest) => await notificationsService.search(params)
);

export const getNotification = createAsyncThunk(
  'notifications/getById',
  async (id: number) => await notificationsService.getById(id)
);

export const dismissNotification = createAsyncThunk(
  'notifications/dismiss',
  async (id: number) => {
    await notificationsService.dismiss(id);
    return id;
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotificationsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchNotifications.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.totalCount = action.payload.totalCount;
        state.loading = false;
      })
      .addCase(searchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load notifications';
      });
  },
});

export const { clearNotificationsError } = notificationsSlice.actions;
export default notificationsSlice.reducer;

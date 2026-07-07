import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import lookupsReducer from '@/features/lookups/lookupsSlice';
import driversReducer from '@/features/drivers/driversSlice';
import licensesReducer from '@/features/licenses/licensesSlice';
import medicalReducer from '@/features/medical/medicalSlice';
import trainingsReducer from '@/features/trainings/trainingsSlice';
import incidentsReducer from '@/features/incidents/incidentsSlice';
import plantMovementsReducer from '@/features/plant-movements/plantMovementsSlice';
import transportersReducer from '@/features/transporters/transportersSlice';
import notificationsReducer from '@/features/notifications/notificationsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    lookups: lookupsReducer,
    drivers: driversReducer,
    licenses: licensesReducer,
    medical: medicalReducer,
    trainings: trainingsReducer,
    incidents: incidentsReducer,
    plantMovements: plantMovementsReducer,
    transporters: transportersReducer,
    notifications: notificationsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { lookupsService } from './lookupsService';
import { LookupsState } from './types';

const initialState: LookupsState = {
  bloodGroups: [],
  endorsements: [],
  vehicleTypes: [],
  driverStatusTypes: [],
  fitnessStatuses: [],
  incidentTypes: [],
  severityLevels: [],
  penaltyTypes: [],
  purposeTypes: [],
  gateNumbers: [],
  trainingTypes: [],
  notificationEntityTypes: [],
  notificationStatuses: [],
  loaded: false,
  loading: false,
};

// Fetches every lookup table in parallel once per session (called from
// DashboardLayout on mount) - reference data changes rarely enough that a
// single fetch per session is the right tradeoff over per-form fetching.
export const fetchAllLookups = createAsyncThunk('lookups/fetchAll', async () => {
  const [
    bloodGroups,
    endorsements,
    vehicleTypes,
    driverStatusTypes,
    fitnessStatuses,
    incidentTypes,
    severityLevels,
    penaltyTypes,
    purposeTypes,
    gateNumbers,
    trainingTypes,
    notificationEntityTypes,
    notificationStatuses,
  ] = await Promise.all([
    lookupsService.getBloodGroups(),
    lookupsService.getEndorsements(),
    lookupsService.getVehicleTypes(),
    lookupsService.getDriverStatusTypes(),
    lookupsService.getFitnessStatuses(),
    lookupsService.getIncidentTypes(),
    lookupsService.getSeverityLevels(),
    lookupsService.getPenaltyTypes(),
    lookupsService.getPurposeTypes(),
    lookupsService.getGateNumbers(),
    lookupsService.getTrainingTypes(),
    lookupsService.getNotificationEntityTypes(),
    lookupsService.getNotificationStatuses(),
  ]);
  return {
    bloodGroups,
    endorsements,
    vehicleTypes,
    driverStatusTypes,
    fitnessStatuses,
    incidentTypes,
    severityLevels,
    penaltyTypes,
    purposeTypes,
    gateNumbers,
    trainingTypes,
    notificationEntityTypes,
    notificationStatuses,
  };
});

const lookupsSlice = createSlice({
  name: 'lookups',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllLookups.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllLookups.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.loaded = true;
        state.loading = false;
      })
      .addCase(fetchAllLookups.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default lookupsSlice.reducer;

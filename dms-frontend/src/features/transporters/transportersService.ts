import { axiosClient } from '@/api/axiosClient';
import { PagedResult } from '@/types/common';
import {
  TransporterDto,
  CreateTransporterRequest,
  UpdateTransporterRequest,
  DriverTransporterAssignmentDto,
  AssignDriverRequest,
  TransporterSearchRequest,
} from './types';

// Matches TransportersController exactly: GET/POST/PUT/DELETE on /api/transporters
// plus driver assignment endpoints.
export const transportersService = {
  search: (params: TransporterSearchRequest) =>
    axiosClient.get<PagedResult<TransporterDto>>('/transporters', { params }).then((r) => r.data),

  getById: (id: number) =>
    axiosClient.get<TransporterDto>(`/transporters/${id}`).then((r) => r.data),

  create: (data: CreateTransporterRequest) =>
    axiosClient.post<TransporterDto>('/transporters', data).then((r) => r.data),

  update: (id: number, data: UpdateTransporterRequest) =>
    axiosClient.put<TransporterDto>(`/transporters/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    axiosClient.delete(`/transporters/${id}`),

  // Driver assignment history
  getAssignmentHistory: (transporterId: number) =>
    axiosClient
      .get<DriverTransporterAssignmentDto[]>(`/transporters/${transporterId}/drivers`)
      .then((r) => r.data),

  assignDriver: (transporterId: number, data: AssignDriverRequest) =>
    axiosClient
      .post<DriverTransporterAssignmentDto>(`/transporters/${transporterId}/drivers`, data)
      .then((r) => r.data),

  unassignDriver: (transporterId: number, driverId: number) =>
    axiosClient.delete(`/transporters/${transporterId}/drivers/${driverId}`),
};

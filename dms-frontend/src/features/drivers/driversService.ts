import { axiosClient } from '@/api/axiosClient';
import { PagedResult } from '@/types/common';
import {
  DriverDto,
  CreateDriverRequest,
  UpdateDriverRequest,
  DriverSearchRequest,
  UpdateDriverStatusRequest,
} from './types';

// Matches DriversController exactly: GET/POST/PUT/PATCH/DELETE on /api/drivers.
export const driversService = {
  search: (params: DriverSearchRequest) =>
    axiosClient.get<PagedResult<DriverDto>>('/drivers', { params }).then((r) => r.data),

  getById: (id: number) =>
    axiosClient.get<DriverDto>(`/drivers/${id}`).then((r) => r.data),

  create: (data: CreateDriverRequest) =>
    axiosClient.post<DriverDto>('/drivers', data).then((r) => r.data),

  update: (id: number, data: UpdateDriverRequest) =>
    axiosClient.put<DriverDto>(`/drivers/${id}`, data).then((r) => r.data),

  updateStatus: (id: number, data: UpdateDriverStatusRequest) =>
    axiosClient.patch(`/drivers/${id}/status`, data),

  delete: (id: number) =>
    axiosClient.delete(`/drivers/${id}`),
};

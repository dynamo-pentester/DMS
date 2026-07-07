import { axiosClient } from '@/api/axiosClient';
import { PagedResult } from '@/types/common';
import {
  LicenseDto,
  CreateLicenseRequest,
  UpdateLicenseRequest,
  LicenseSearchRequest,
} from './types';

// Matches LicensesController exactly: GET/POST/PUT/DELETE on /api/licenses.
export const licensesService = {
  search: (params: LicenseSearchRequest) =>
    axiosClient.get<PagedResult<LicenseDto>>('/licenses', { params }).then((r) => r.data),

  getById: (id: number) =>
    axiosClient.get<LicenseDto>(`/licenses/${id}`).then((r) => r.data),

  create: (data: CreateLicenseRequest) =>
    axiosClient.post<LicenseDto>('/licenses', data).then((r) => r.data),

  update: (id: number, data: UpdateLicenseRequest) =>
    axiosClient.put<LicenseDto>(`/licenses/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    axiosClient.delete(`/licenses/${id}`),
};

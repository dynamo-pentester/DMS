import { axiosClient } from '@/api/axiosClient';
import { PagedResult } from '@/types/common';
import {
  MedicalRecordDto,
  CreateMedicalRecordRequest,
  UpdateMedicalRecordRequest,
  MedicalRecordSearchRequest,
} from './types';

// Matches MedicalRecordsController exactly: GET/POST/PUT/DELETE on /api/medical-records.
export const medicalService = {
  search: (params: MedicalRecordSearchRequest) =>
    axiosClient.get<PagedResult<MedicalRecordDto>>('/medical-records', { params }).then((r) => r.data),

  getById: (id: number) =>
    axiosClient.get<MedicalRecordDto>(`/medical-records/${id}`).then((r) => r.data),

  create: (data: CreateMedicalRecordRequest) =>
    axiosClient.post<MedicalRecordDto>('/medical-records', data).then((r) => r.data),

  update: (id: number, data: UpdateMedicalRecordRequest) =>
    axiosClient.put<MedicalRecordDto>(`/medical-records/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    axiosClient.delete(`/medical-records/${id}`),
};

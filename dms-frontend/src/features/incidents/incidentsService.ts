import { axiosClient } from '@/api/axiosClient';
import { PagedResult } from '@/types/common';
import {
  IncidentDto,
  CorrectiveActionDto,
  CreateIncidentRequest,
  UpdateIncidentRequest,
  AddCorrectiveActionRequest,
  IncidentSearchRequest,
} from './types';

// Matches IncidentsController exactly: GET/POST/PUT/DELETE on /api/incidents
// plus POST /api/incidents/:id/corrective-actions.
export const incidentsService = {
  search: (params: IncidentSearchRequest) =>
    axiosClient.get<PagedResult<IncidentDto>>('/incidents', { params }).then((r) => r.data),

  getById: (id: number) =>
    axiosClient.get<IncidentDto>(`/incidents/${id}`).then((r) => r.data),

  create: (data: CreateIncidentRequest) =>
    axiosClient.post<IncidentDto>('/incidents', data).then((r) => r.data),

  update: (id: number, data: UpdateIncidentRequest) =>
    axiosClient.put<IncidentDto>(`/incidents/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    axiosClient.delete(`/incidents/${id}`),

  addCorrectiveAction: (incidentId: number, data: AddCorrectiveActionRequest) =>
    axiosClient
      .post<CorrectiveActionDto>(`/incidents/${incidentId}/corrective-actions`, data)
      .then((r) => r.data),
};

import { axiosClient } from '@/api/axiosClient';
import { PagedResult } from '@/types/common';
import {
  PlantMovementDto,
  CreatePlantMovementRequest,
  RecordExitRequest,
  PlantMovementSearchRequest,
} from './types';

// Matches PlantMovementsController exactly: GET/POST on /api/plant-movements
// and PATCH /api/plant-movements/:id/exit.
export const plantMovementsService = {
  search: (params: PlantMovementSearchRequest) =>
    axiosClient.get<PagedResult<PlantMovementDto>>('/plant-movements', { params }).then((r) => r.data),

  getById: (id: number) =>
    axiosClient.get<PlantMovementDto>(`/plant-movements/${id}`).then((r) => r.data),

  recordEntry: (data: CreatePlantMovementRequest) =>
    axiosClient.post<PlantMovementDto>('/plant-movements', data).then((r) => r.data),

  recordExit: (id: number, data: RecordExitRequest) =>
    axiosClient.patch<PlantMovementDto>(`/plant-movements/${id}/exit`, data).then((r) => r.data),
};

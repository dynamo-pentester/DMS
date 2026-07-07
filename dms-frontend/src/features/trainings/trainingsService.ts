import { axiosClient } from '@/api/axiosClient';
import { PagedResult } from '@/types/common';
import {
  TrainingDto,
  CreateTrainingRequest,
  UpdateTrainingRequest,
  TrainingSearchRequest,
} from './types';

// Matches TrainingsController exactly: GET/POST/PUT/DELETE on /api/trainings.
export const trainingsService = {
  search: (params: TrainingSearchRequest) =>
    axiosClient.get<PagedResult<TrainingDto>>('/trainings', { params }).then((r) => r.data),

  getById: (id: number) =>
    axiosClient.get<TrainingDto>(`/trainings/${id}`).then((r) => r.data),

  create: (data: CreateTrainingRequest) =>
    axiosClient.post<TrainingDto>('/trainings', data).then((r) => r.data),

  update: (id: number, data: UpdateTrainingRequest) =>
    axiosClient.put<TrainingDto>(`/trainings/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    axiosClient.delete(`/trainings/${id}`),
};

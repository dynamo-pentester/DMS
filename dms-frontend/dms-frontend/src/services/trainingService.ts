import { api } from "@/api/axiosInstance";
import type { PagedResult } from "@/types/common";
import type { Training, CreateTrainingRequest, UpdateTrainingRequest, TrainingSearchParams } from "@/types/training";

export const trainingService = {
  search: async (params: TrainingSearchParams): Promise<PagedResult<Training>> => {
    const { data } = await api.get<PagedResult<Training>>("/trainings", { params });
    return data;
  },

  getById: async (id: number): Promise<Training> => {
    const { data } = await api.get<Training>(`/trainings/${id}`);
    return data;
  },

  create: async (payload: CreateTrainingRequest): Promise<Training> => {
    const { data } = await api.post<Training>("/trainings", payload);
    return data;
  },

  update: async (id: number, payload: UpdateTrainingRequest): Promise<Training> => {
    const { data } = await api.put<Training>(`/trainings/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/trainings/${id}`);
  },
};
export default trainingService;

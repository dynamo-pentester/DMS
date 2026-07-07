import { api } from "@/api/axiosInstance";
import type { PagedResult } from "@/types/common";
import type {
  PlantMovement,
  CreatePlantMovementRequest,
  UpdatePlantMovementRequest,
  PlantMovementSearchParams,
} from "@/types/plantMovement";

export const plantMovementService = {
  search: async (params: PlantMovementSearchParams): Promise<PagedResult<PlantMovement>> => {
    const { data } = await api.get<PagedResult<PlantMovement>>("/plant-movements", { params });
    return data;
  },

  getById: async (id: number): Promise<PlantMovement> => {
    const { data } = await api.get<PlantMovement>(`/plant-movements/${id}`);
    return data;
  },

  create: async (payload: CreatePlantMovementRequest): Promise<PlantMovement> => {
    const { data } = await api.post<PlantMovement>("/plant-movements", payload);
    return data;
  },

  update: async (id: number, payload: UpdatePlantMovementRequest): Promise<PlantMovement> => {
    const { data } = await api.put<PlantMovement>(`/plant-movements/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/plant-movements/${id}`);
  },

  /** Record a vehicle exit (convenience wrapper for updating exitDateTime) */
  recordExit: async (id: number, exitDateTime: string): Promise<PlantMovement> => {
    const { data } = await api.patch<PlantMovement>(`/plant-movements/${id}/exit`, { exitDateTime });
    return data;
  },
};

export default plantMovementService;

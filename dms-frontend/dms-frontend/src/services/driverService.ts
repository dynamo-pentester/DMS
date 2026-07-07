import { api } from "@/api/axiosInstance";
import type { PagedResult } from "@/types/common";
import type {
  Driver,
  CreateDriverRequest,
  UpdateDriverRequest,
  UpdateDriverStatusRequest,
  DriverSearchParams,
} from "@/types/driver";

export const driverService = {
  search: async (params: DriverSearchParams): Promise<PagedResult<Driver>> => {
    const { data } = await api.get<PagedResult<Driver>>("/drivers", { params });
    return data;
  },

  getById: async (id: number): Promise<Driver> => {
    const { data } = await api.get<Driver>(`/drivers/${id}`);
    return data;
  },

  create: async (payload: CreateDriverRequest): Promise<Driver> => {
    const { data } = await api.post<Driver>("/drivers", payload);
    return data;
  },

  update: async (id: number, payload: UpdateDriverRequest): Promise<Driver> => {
    const { data } = await api.put<Driver>(`/drivers/${id}`, payload);
    return data;
  },

  updateStatus: async (id: number, payload: UpdateDriverStatusRequest): Promise<void> => {
    await api.patch(`/drivers/${id}/status`, payload);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/drivers/${id}`);
  },
};
export default driverService;

import { api } from "@/api/axiosInstance";
import type { PagedResult } from "@/types/common";
import type { License, CreateLicenseRequest, UpdateLicenseRequest, LicenseSearchParams } from "@/types/license";

export const licenseService = {
  search: async (params: LicenseSearchParams): Promise<PagedResult<License>> => {
    const { data } = await api.get<PagedResult<License>>("/licenses", { params });
    return data;
  },

  getById: async (id: number): Promise<License> => {
    const { data } = await api.get<License>(`/licenses/${id}`);
    return data;
  },

  create: async (payload: CreateLicenseRequest): Promise<License> => {
    const { data } = await api.post<License>("/licenses", payload);
    return data;
  },

  update: async (id: number, payload: UpdateLicenseRequest): Promise<License> => {
    const { data } = await api.put<License>(`/licenses/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/licenses/${id}`);
  },
};
export default licenseService;

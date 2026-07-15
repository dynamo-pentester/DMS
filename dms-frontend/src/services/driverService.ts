import { api } from "@/api/axiosInstance";
import { buildFormData } from "@/utils/formData";
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

  /**
   * Creates a driver. When a photo is provided, it's saved together with the
   * driver record in a single multipart/form-data request - there is no
   * separate "upload after create" step anymore.
   */
  create: async (payload: CreateDriverRequest, photo?: File | null): Promise<Driver> => {
    const formData = buildFormData(payload as unknown as Record<string, unknown>);
    if (photo) formData.append("photo", photo);
    const { data } = await api.post<Driver>("/drivers", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  createWithLicense: async (
    payload: any,
    photo?: File | null,
    licenseDocument?: File | null
  ): Promise<Driver> => {
    const formData = buildFormData(payload as unknown as Record<string, unknown>);
    if (photo) formData.append("photo", photo);
    if (licenseDocument) formData.append("licenseDocument", licenseDocument);
    const { data } = await api.post<Driver>("/drivers/with-license", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
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

  /** Uploads (or replaces) the driver's photo. Returns the updated driver record. */
  uploadPhoto: async (id: number, file: File): Promise<Driver> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<Driver>(`/drivers/${id}/photo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
export default driverService;

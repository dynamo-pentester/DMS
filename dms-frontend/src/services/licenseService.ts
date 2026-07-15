import { api } from "@/api/axiosInstance";
import { buildFormData } from "@/utils/formData";
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

  /**
   * Creates a license. When a document is provided, it's saved together with
   * the license record in a single multipart/form-data request - there is no
   * separate "upload after create" step anymore.
   */
  create: async (payload: CreateLicenseRequest, document?: File | null): Promise<License> => {
    const formData = buildFormData(payload as unknown as Record<string, unknown>);
    if (document) formData.append("document", document);
    const { data } = await api.post<License>("/licenses", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  update: async (id: number, payload: UpdateLicenseRequest): Promise<License> => {
    const { data } = await api.put<License>(`/licenses/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/licenses/${id}`);
  },

  /** Uploads (or replaces) the scanned licence document. Returns the updated license record. */
  uploadDocument: async (id: number, file: File): Promise<License> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<License>(`/licenses/${id}/document`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
export default licenseService;

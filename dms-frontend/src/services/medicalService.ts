import { api } from "@/api/axiosInstance";
import { buildFormData } from "@/utils/formData";
import type { PagedResult } from "@/types/common";
import type {
  MedicalRecord,
  CreateMedicalRecordRequest,
  UpdateMedicalRecordRequest,
  MedicalRecordSearchParams,
} from "@/types/medicalRecord";

export const medicalService = {
  search: async (params: MedicalRecordSearchParams): Promise<PagedResult<MedicalRecord>> => {
    const { data } = await api.get<PagedResult<MedicalRecord>>("/medical-records", { params });
    return data;
  },

  getById: async (id: number): Promise<MedicalRecord> => {
    const { data } = await api.get<MedicalRecord>(`/medical-records/${id}`);
    return data;
  },

  /**
   * Creates a medical record. When a certificate is provided, it's saved
   * together with the record in a single multipart/form-data request - there
   * is no separate "upload after create" step anymore.
   */
  create: async (payload: CreateMedicalRecordRequest, certificate?: File | null): Promise<MedicalRecord> => {
    const formData = buildFormData(payload as unknown as Record<string, unknown>);
    if (certificate) formData.append("certificate", certificate);
    const { data } = await api.post<MedicalRecord>("/medical-records", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  update: async (id: number, payload: UpdateMedicalRecordRequest): Promise<MedicalRecord> => {
    const { data } = await api.put<MedicalRecord>(`/medical-records/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/medical-records/${id}`);
  },

  /** Uploads (or replaces) the medical certificate. Returns the updated record. */
  uploadCertificate: async (id: number, file: File): Promise<MedicalRecord> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<MedicalRecord>(`/medical-records/${id}/certificate`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
export default medicalService;

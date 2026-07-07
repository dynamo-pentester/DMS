import { api } from "@/api/axiosInstance";
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

  create: async (payload: CreateMedicalRecordRequest): Promise<MedicalRecord> => {
    const { data } = await api.post<MedicalRecord>("/medical-records", payload);
    return data;
  },

  update: async (id: number, payload: UpdateMedicalRecordRequest): Promise<MedicalRecord> => {
    const { data } = await api.put<MedicalRecord>(`/medical-records/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/medical-records/${id}`);
  },
};
export default medicalService;

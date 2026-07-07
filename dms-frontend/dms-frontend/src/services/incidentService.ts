import { api } from "@/api/axiosInstance";
import type { PagedResult } from "@/types/common";
import type {
  Incident,
  CreateIncidentRequest,
  UpdateIncidentRequest,
  AddCorrectiveActionRequest,
  IncidentSearchParams,
  CorrectiveAction,
} from "@/types/incident";

export const incidentService = {
  search: async (params: IncidentSearchParams): Promise<PagedResult<Incident>> => {
    const { data } = await api.get<PagedResult<Incident>>("/incidents", { params });
    return data;
  },

  getById: async (id: number): Promise<Incident> => {
    const { data } = await api.get<Incident>(`/incidents/${id}`);
    return data;
  },

  create: async (payload: CreateIncidentRequest): Promise<Incident> => {
    const { data } = await api.post<Incident>("/incidents", payload);
    return data;
  },

  update: async (id: number, payload: UpdateIncidentRequest): Promise<Incident> => {
    const { data } = await api.put<Incident>(`/incidents/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/incidents/${id}`);
  },

  addCorrectiveAction: async (id: number, payload: AddCorrectiveActionRequest): Promise<CorrectiveAction> => {
    const { data } = await api.post<CorrectiveAction>(`/incidents/${id}/corrective-actions`, payload);
    return data;
  },
};
export default incidentService;

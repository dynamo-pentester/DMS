import { api } from "@/api/axiosInstance";
import type { PagedResult } from "@/types/common";
import type {
  Transporter,
  CreateTransporterRequest,
  UpdateTransporterRequest,
  TransporterSearchParams,
  AssignDriverRequest,
  DriverTransporterAssignment,
} from "@/types/transporter";

export const transporterService = {
  search: async (params: TransporterSearchParams): Promise<PagedResult<Transporter>> => {
    const { data } = await api.get<PagedResult<Transporter>>("/transporters", { params });
    return data;
  },

  getById: async (id: number): Promise<Transporter> => {
    const { data } = await api.get<Transporter>(`/transporters/${id}`);
    return data;
  },

  create: async (payload: CreateTransporterRequest): Promise<Transporter> => {
    const { data } = await api.post<Transporter>("/transporters", payload);
    return data;
  },

  update: async (id: number, payload: UpdateTransporterRequest): Promise<Transporter> => {
    const { data } = await api.put<Transporter>(`/transporters/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/transporters/${id}`);
  },

  assignDriver: async (id: number, payload: AssignDriverRequest): Promise<DriverTransporterAssignment> => {
    const { data } = await api.post<DriverTransporterAssignment>(`/transporters/${id}/drivers`, payload);
    return data;
  },

  unassignDriver: async (id: number, driverId: number): Promise<void> => {
    await api.delete(`/transporters/${id}/drivers/${driverId}`);
  },

  getAssignmentHistory: async (id: number): Promise<DriverTransporterAssignment[]> => {
    const { data } = await api.get<DriverTransporterAssignment[]>(`/transporters/${id}/drivers`);
    return data;
  },
};
export default transporterService;

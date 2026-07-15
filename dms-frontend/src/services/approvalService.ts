import { api } from "@/api/axiosInstance";
import type { DriverApproval } from "@/types/approval";

export const approvalService = {
  getPending: async (): Promise<DriverApproval[]> => {
    const { data } = await api.get<DriverApproval[]>("/approvals/pending");
    return data;
  },

  getMyRequests: async (): Promise<DriverApproval[]> => {
    const { data } = await api.get<DriverApproval[]>("/approvals/my-requests");
    return data;
  },

  approve: async (id: number, comments?: string): Promise<void> => {
    await api.put(`/approvals/${id}/approve`, { comments });
  },

  reject: async (id: number, comments?: string): Promise<void> => {
    await api.put(`/approvals/${id}/reject`, { comments });
  },
};

export default approvalService;

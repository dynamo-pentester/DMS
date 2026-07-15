import { api } from "@/api/axiosInstance";
import { buildFormData } from "@/utils/formData";
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

  /**
   * Reports a new incident. When a report document is provided, it's saved
   * together with the incident in a single multipart/form-data request - there
   * is no separate "upload after create" step anymore.
   */
  create: async (payload: CreateIncidentRequest, report?: File | null): Promise<Incident> => {
    const formData = buildFormData(payload as unknown as Record<string, unknown>);
    if (report) formData.append("report", report);
    const { data } = await api.post<Incident>("/incidents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  update: async (id: number, payload: UpdateIncidentRequest): Promise<Incident> => {
    const { data } = await api.put<Incident>(`/incidents/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/incidents/${id}`);
  },

  /**
   * Attaches a corrective action to an incident. When an apologyDocument file is
   * provided the request is sent as multipart/form-data so the file travels in the
   * same call - there is no separate "upload after create" step (mirrors the report
   * upload pattern used by incidentService.create).
   */
  addCorrectiveAction: async (
    id: number,
    payload: AddCorrectiveActionRequest,
    apologyDocument?: File | null
  ): Promise<CorrectiveAction> => {
    if (apologyDocument) {
      const formData = buildFormData(payload as unknown as Record<string, unknown>);
      formData.append("apologyDocument", apologyDocument);
      const { data } = await api.post<CorrectiveAction>(
        `/incidents/${id}/corrective-actions`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data;
    }
    // No file: the backend still accepts [FromForm] for a plain form submission.
    const formData = buildFormData(payload as unknown as Record<string, unknown>);
    const { data } = await api.post<CorrectiveAction>(
      `/incidents/${id}/corrective-actions`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },

  /** Uploads (or replaces) the incident report document. Returns the updated incident record. */
  uploadReport: async (id: number, file: File): Promise<Incident> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<Incident>(`/incidents/${id}/report`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  /**
   * Uploads (or replaces) the letter-of-apology / supporting attachment on a
   * corrective action. Returns the updated incident record (with the corrective
   * action's hasAttachment flag refreshed).
   */
  uploadCorrectiveActionAttachment: async (incidentId: number, correctiveActionId: number, file: File): Promise<Incident> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<Incident>(
      `/incidents/${incidentId}/corrective-actions/${correctiveActionId}/attachment`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },

  /**
   * Returns the relative API URL for streaming / downloading a corrective action's
   * apology document. Mirrors the `/incidents/${incidentId}/report` pattern used for
   * the incident report FileUpload. The path is consumed by the FileUpload component's
   * fileUrl prop and never stored on the client.
   */
  getApologyDocumentUrl: (incidentId: number, correctiveActionId: number): string =>
    `/incidents/${incidentId}/corrective-actions/${correctiveActionId}/apology-document`,
};
export default incidentService;

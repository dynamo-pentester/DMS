import { AxiosError } from 'axios';
import { ApiErrorShape } from '@/types/common';

/**
 * Normalizes the two error response shapes the backend actually returns:
 *  - `{ error: "..." }` from InvalidOperationException/KeyNotFoundException catch
 *    blocks (Licenses, MedicalRecords, Trainings, Incidents, PlantMovements, Notifications)
 *  - `{ errors: [...] }` or `{ errors: { field: string[] } }` from Identity results
 *    (AuthController) and FluentValidation (CreateDriverRequestValidator)
 * There is no global exception-handling middleware in Driver.API, so a handful of
 * endpoints (Drivers/Transporters Update, UpdateStatus, Delete, AssignDriver,
 * UnassignDriver) throw KeyNotFoundException uncaught - those surface here as a
 * generic 500 with no JSON body, not a clean 404. See the backend analysis report,
 * "Known gaps" section, item 1.
 */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const axiosErr = err as AxiosError<ApiErrorShape>;
  const data = axiosErr?.response?.data;

  if (!data) {
    if (axiosErr?.response?.status === 500) {
      return 'The server returned an unexpected error. If you were updating or deleting a record, it may no longer exist.';
    }
    return fallback;
  }

  if (typeof data.error === 'string') return data.error;

  if (Array.isArray(data.errors)) return data.errors.join(' ');

  if (data.errors && typeof data.errors === 'object') {
    return Object.values(data.errors).flat().join(' ');
  }

  return fallback;
}

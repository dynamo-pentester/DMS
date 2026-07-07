// Mirrors DriverDms.Application.DTOs.PagedResult<T> exactly.
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface LookupItem {
  id: number;
  name: string;
}

// Every backend controller that returns a validation/business-rule error uses
// either `{ error: string }` (InvalidOperationException catch blocks) or
// `{ errors: string[] }` (Identity/FluentValidation). This union covers both
// so apiErrorMessage() in utils/errorUtils.ts can normalize either shape.
export interface ApiErrorShape {
  error?: string;
  errors?: string[] | Record<string, string[]>;
}

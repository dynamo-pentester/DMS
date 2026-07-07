import { format, parseISO, isValid } from 'date-fns';

export function formatDate(value?: string | Date | null, pattern = 'dd MMM yyyy'): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? parseISO(value) : value;
  return isValid(date) ? format(date, pattern) : '—';
}

export function formatDateTime(value?: string | Date | null): string {
  return formatDate(value, 'dd MMM yyyy, HH:mm');
}

// <input type="date"> needs yyyy-MM-dd; backend DateTime fields serialize as
// ISO 8601 - this bridges the two for react-hook-form default values.
export function toDateInputValue(value?: string | Date | null): string {
  if (!value) return '';
  const date = typeof value === 'string' ? parseISO(value) : value;
  return isValid(date) ? format(date, 'yyyy-MM-dd') : '';
}

import { AxiosError } from 'axios';
import { ApiErrorResponse, ApiResponse } from '../types';

export interface ParsedApiError {
  status?: number;
  message: string;
  fieldErrors: Record<string, string>;
  traceId?: string;
}

/**
 * Normalize an axios/unknown error into a stable shape the admin UI can
 * present. Surfaces field-level validation errors when the backend returned
 * them (HTTP 400/422 from {@code ApiErrorResponse}) and falls back to a
 * generic, user-readable message for network / 5xx failures.
 */
export const parseApiError = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): ParsedApiError => {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosErr = error as AxiosError<ApiErrorResponse | ApiResponse<unknown>>;
    const data = axiosErr.response?.data as ApiErrorResponse | undefined;
    if (!axiosErr.response) {
      return { message: 'Network error. Please check your connection and try again.', fieldErrors: {} };
    }
    if (data && typeof data === 'object' && 'message' in data) {
      return {
        status: axiosErr.response.status,
        message: data.message || fallback,
        fieldErrors: data.fieldErrors ?? {},
        traceId: data.traceId,
      };
    }
    return { status: axiosErr.response.status, message: fallback, fieldErrors: {} };
  }
  if (error instanceof Error) {
    return { message: error.message || fallback, fieldErrors: {} };
  }
  return { message: fallback, fieldErrors: {} };
};

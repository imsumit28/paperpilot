import type { AssignmentDto } from '../schemas/assignment.schema';

export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiFailure {
  ok: false;
  error: ApiError;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateAssignmentResponse {
  id: string;
  jobId: string;
}

export type AssignmentListResponse = PaginatedResponse<AssignmentDto>;

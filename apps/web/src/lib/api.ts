import type {
  ApiResponse,
  AssignmentDto,
  AssignmentListResponse,
  CreateAssignmentInput,
  CreateAssignmentResponse,
} from '@paper-pilot/shared';
import { getDeviceId } from './device';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/** Header the backend reads to scope every request to the calling device. */
const DEVICE_HEADER = 'X-Device-Id';

/** Merge the device id into a request's headers so data stays per-device. */
function withDevice(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  const id = getDeviceId();
  if (id) headers.set(DEVICE_HEADER, id);
  return headers;
}

class ApiError extends Error {
  constructor(public code: string, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

async function unwrap<T>(res: Response): Promise<T> {
  const text = await res.text();
  let body: ApiResponse<T> | null = null;
  try {
    body = text ? (JSON.parse(text) as ApiResponse<T>) : null;
  } catch {
    /* fallthrough */
  }
  if (!res.ok || !body || body.ok === false) {
    const err = body && body.ok === false ? body.error : null;
    throw new ApiError(
      err?.code ?? `HTTP_${res.status}`,
      err?.message ?? `Request failed (${res.status})`,
      err?.fields,
    );
  }
  return body.data as T;
}

interface CreatePayload extends Omit<CreateAssignmentInput, 'dueDate'> {
  dueDate: string;
}

export async function createAssignment(
  payload: CreatePayload,
  file?: File | null,
): Promise<CreateAssignmentResponse & { assignment: AssignmentDto }> {
  if (file) {
    const form = new FormData();
    form.append('payload', JSON.stringify(payload));
    form.append('file', file);
    const res = await fetch(`${BASE_URL}/api/assignments`, {
      method: 'POST',
      headers: withDevice(),
      body: form,
    });
    return unwrap(res);
  }
  const res = await fetch(`${BASE_URL}/api/assignments`, {
    method: 'POST',
    headers: withDevice({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return unwrap(res);
}

export async function listAssignments(page = 1, pageSize = 20): Promise<AssignmentListResponse> {
  const res = await fetch(`${BASE_URL}/api/assignments?page=${page}&pageSize=${pageSize}`, {
    cache: 'no-store',
    headers: withDevice(),
  });
  return unwrap(res);
}

export async function getAssignment(id: string): Promise<AssignmentDto> {
  const res = await fetch(`${BASE_URL}/api/assignments/${id}`, {
    cache: 'no-store',
    headers: withDevice(),
  });
  return unwrap(res);
}

export async function deleteAssignment(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/assignments/${id}`, {
    method: 'DELETE',
    headers: withDevice(),
  });
  // 404 = already deleted; treat as success since DELETE is idempotent.
  if (res.ok || res.status === 204 || res.status === 404) return;
  let message = `Delete failed (${res.status})`;
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    if (body?.error?.message) message = body.error.message;
  } catch {
    /* ignore */
  }
  throw new ApiError('DELETE_FAILED', message);
}

export async function regenerateAssignment(
  id: string,
  options: { additionalInfoAppend?: string } = {},
): Promise<CreateAssignmentResponse & { assignment: AssignmentDto }> {
  const hasBody = Boolean(options.additionalInfoAppend && options.additionalInfoAppend.trim());
  const res = await fetch(`${BASE_URL}/api/assignments/${id}/regenerate`, {
    method: 'POST',
    headers: withDevice(hasBody ? { 'Content-Type': 'application/json' } : undefined),
    body: hasBody ? JSON.stringify(options) : undefined,
  });
  return unwrap(res);
}

export function pdfDownloadUrl(id: string) {
  // PDFs are fetched via plain GET navigation (window.open / <a download>),
  // which can't set custom headers — so the device id rides along as a query
  // param. The backend accepts it from either the header or here.
  const deviceId = getDeviceId();
  const query = deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : '';
  return `${BASE_URL}/api/assignments/${id}/pdf${query}`;
}

export { ApiError };

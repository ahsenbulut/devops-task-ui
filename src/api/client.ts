const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details: string[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorBody {
  error?: { message?: string; details?: string[] };
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body !== undefined) headers.set('Content-Type', 'application/json');
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'Cannot reach the OpsDesk API. Check your connection and try again.');
  }

  const body = (await response.json().catch(() => null)) as ({ data: T } & ErrorBody) | null;
  if (!response.ok || body === null) {
    throw new ApiError(
      response.status,
      body?.error?.message ?? `Request failed with status ${response.status}`,
      body?.error?.details ?? [],
    );
  }
  return body.data;
}

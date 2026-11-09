/**
 * Enterprise-grade native fetch layer — zero axios.
 * JWT injection, structured Go errors, 401 refresh, request tracing.
 */

import { errorMessage, UserFacingError, type ErrorContext } from '../userMessage';
import { actionSuccessMessage, beginAction, showToast } from '../actionFeedback';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

type TokenGetter = () => string | null | undefined;
type RefreshHandler = () => Promise<boolean>;
type UnauthorizedHandler = () => void;

let tokenGetter: TokenGetter = () => null;
let refreshHandler: RefreshHandler | null = null;
let onUnauthorized: UnauthorizedHandler | null = null;

const inflightRefresh: { promise: Promise<boolean> | null } = { promise: null };

export interface ConfigureSecureFetchOptions {
  getToken?: TokenGetter;
  refreshToken?: RefreshHandler;
  handleUnauthorized?: UnauthorizedHandler;
}

export function configureSecureFetch({
  getToken,
  refreshToken,
  handleUnauthorized,
}: ConfigureSecureFetchOptions = {}) {
  if (getToken) tokenGetter = getToken;
  if (refreshToken) refreshHandler = refreshToken;
  if (handleUnauthorized) onUnauthorized = handleUnauthorized;
}

export interface ApiErrorInit extends ErrorContext {
  details?: unknown;
  requestId?: string | null;
}

export class ApiError extends UserFacingError {
  status: number;
  code: string;
  details: unknown;
  requestId: string | null;

  constructor(message: string, { status, code, details, requestId, path, method }: ApiErrorInit = {}) {
    super(errorMessage(message, { status, code, path, method }));
    this.name = 'ApiError';
    this.status = status ?? 0;
    this.code = /fully booked|resource.*conflict/i.test(message) && (status === 409 || status === 422)
      ? 'BOOKING_TIME_UNAVAILABLE' : code ?? 'UNKNOWN';
    this.details = details ?? null;
    this.requestId = requestId ?? null;
  }
}

function createRequestId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  const text = await response.text();
  return text || null;
}

function extractErrorMessage(body: any, status: number) {
  if (!body) return `Request failed (${status})`;
  if (typeof body === 'string') return body;
  if (body.message) return body.message;
  if (body.error) return typeof body.error === 'string' ? body.error : body.error.message;
  if (body.detail) return typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
  return `Request failed (${status})`;
}

async function attemptTokenRefresh() {
  if (!refreshHandler) return false;
  if (!inflightRefresh.promise) {
    inflightRefresh.promise = refreshHandler()
      .then((ok) => Boolean(ok))
      .catch(() => false)
      .finally(() => {
        inflightRefresh.promise = null;
      });
  }
  return inflightRefresh.promise;
}

export interface SecureFetchOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
  signal?: AbortSignal;
  formData?: FormData;
}

async function executeFetch(
  path: string,
  options: SecureFetchOptions,
  requestId: string,
  isRetry = false,
): Promise<any> {
  const {
    method = 'GET',
    body,
    headers: customHeaders = {},
    auth = true,
    signal,
    formData,
  } = options;

  if (!navigator.onLine) {
    throw new ApiError('You appear to be offline. Check your connection and try again.', {
      status: 0,
      code: 'OFFLINE',
      requestId,
      path,
      method,
    });
  }

  // Request ID is kept client-side only — sending it as a header triggers CORS
  // preflight unless the backend explicitly allows X-Request-Id.
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...customHeaders,
  };

  if (body !== undefined && body !== null && !formData) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = tokenGetter();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: formData ?? (body !== undefined && body !== null ? JSON.stringify(body) : undefined),
      signal,
    });
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Network error. Please check your connection and retry.', {
      status: 0,
      code: 'NETWORK_ERROR',
      details: err.message,
      requestId,
      path,
      method,
    });
  }

  if (response.status === 401 && auth && !isRetry) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) return executeFetch(path, options, requestId, true);
    onUnauthorized?.();
    throw new ApiError('Session expired. Please sign in again.', {
      status: 401,
      code: 'UNAUTHORIZED',
      requestId,
    });
  }

  const data = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(extractErrorMessage(data, response.status), {
      status: response.status,
      code: data?.code ?? `HTTP_${response.status}`,
      details: data,
      requestId,
      path,
      method,
    });
  }

  return data;
}

export async function secureFetch(path: string, options: SecureFetchOptions = {}) {
  const requestId = createRequestId();
  const method = (options.method || 'GET').toUpperCase();
  const mutation = /^(POST|PUT|PATCH|DELETE)$/.test(method);
  // ERP forms announce their own saving, success and recovery state in place.
  const silent = /\/(?:login|logout|refresh)(?:\/|\?|$)/.test(path) || /\/settlements\/alerts\/[^/]+\/read$/.test(path) || /\/erp\//.test(path);
  const endAction = mutation && !silent ? beginAction() : () => {};
  try {
    const result = await executeFetch(path, options, requestId);
    if (mutation && !silent) showToast(actionSuccessMessage(path, method));
    return result;
  } catch (error) {
    if (mutation && !silent && (error as Error)?.name !== 'AbortError') showToast(errorMessage(error), 'error');
    throw error;
  } finally { endAction(); }
}

export const secureApi = {
  get: (path: string, opts?: SecureFetchOptions) => secureFetch(path, { ...opts, method: 'GET' }),
  post: (path: string, body?: unknown, opts?: SecureFetchOptions) =>
    secureFetch(path, { ...opts, method: 'POST', body }),
  patch: (path: string, body?: unknown, opts?: SecureFetchOptions) =>
    secureFetch(path, { ...opts, method: 'PATCH', body }),
  put: (path: string, body?: unknown, opts?: SecureFetchOptions) =>
    secureFetch(path, { ...opts, method: 'PUT', body }),
  delete: (path: string, opts?: SecureFetchOptions) => secureFetch(path, { ...opts, method: 'DELETE' }),
  upload: (path: string, formData: FormData, opts?: SecureFetchOptions) =>
    secureFetch(path, { ...opts, method: 'POST', formData }),
};

export default secureApi;

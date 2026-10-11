import type { z } from 'zod';
import { apiResultSchema } from '@/lib/api/schemas/result';
import type { ApiError, ApiResult } from '@/types/api';

const REQUEST_TIMEOUT_MS = 10_000;

export const NETWORK_ERROR: ApiError = {
  code: 'network',
  message: "Can't reach Lineup. Check your connection.",
  retryAfterMs: null,
};

export const BAD_RESPONSE_ERROR: ApiError = {
  code: 'server_error',
  message: 'Something went wrong. Try again.',
  retryAfterMs: null,
};

export type HttpMethod = 'GET' | 'POST';

export type QueryValue = string | number | null | undefined;

export type RequestOptions = {
  body?: unknown;
  query?: Record<string, QueryValue>;
};

export type Transport = <S extends z.ZodType>(
  method: HttpMethod,
  path: string,
  dataSchema: S,
  options?: RequestOptions,
) => Promise<ApiResult<z.output<S>>>;

function urlOf(baseUrl: string, path: string, query: RequestOptions['query']) {
  const url = new URL(path, baseUrl);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

function initOf(method: HttpMethod, body: unknown): RequestInit {
  const hasBody = body !== undefined;
  return {
    method,
    // Sends the session cookie cross-origin
    credentials: 'include',
    cache: 'no-store',
    headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
    body: hasBody ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  };
}

// Paths only: a body could hold player data
function reportDrift(method: HttpMethod, path: string, detail: string[]) {
  if (process.env.NODE_ENV === 'production') return;
  console.error(`[api] ${method} ${path}: bad response`, detail);
}

function parseJson(text: string): { value: unknown } | null {
  try {
    return { value: JSON.parse(text) };
  } catch {
    return null;
  }
}

export function createTransport(baseUrl: string): Transport {
  return async function request<S extends z.ZodType>(
    method: HttpMethod,
    path: string,
    dataSchema: S,
    options: RequestOptions = {},
  ): Promise<ApiResult<z.output<S>>> {
    let text: string;
    try {
      const response = await fetch(
        urlOf(baseUrl, path, options.query),
        initOf(method, options.body),
      );
      text = await response.text();
    } catch {
      return { success: false, error: NETWORK_ERROR };
    }

    const json = parseJson(text);
    if (!json) {
      reportDrift(method, path, ['not JSON']);
      return { success: false, error: BAD_RESPONSE_ERROR };
    }

    const parsed = apiResultSchema(dataSchema).safeParse(json.value);
    if (!parsed.success) {
      const paths = parsed.error.issues.map((issue) => issue.path.join('.'));
      reportDrift(method, path, paths);
      return { success: false, error: BAD_RESPONSE_ERROR };
    }

    return parsed.data as ApiResult<z.output<S>>;
  };
}

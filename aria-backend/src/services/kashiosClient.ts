import { env } from '../config/env';
import { HttpError } from '../types/http';

/**
 * Cliente mínimo para consumir el API de KashioOS (`KASHIOS_API_BASE_URL`).
 * Usa `fetch` global (Node 22+). Aplica `Authorization: Bearer ${KASHIOS_API_TOKEN}`
 * y un AbortController con `KASHIOS_TIMEOUT_MS` (default 15s).
 *
 * Cualquier error de red o status >= 400 se propaga como `HttpError` con un código
 * razonable para que el endpoint que lo invoque devuelva un 4xx/5xx coherente.
 */

function ensureConfig(): { baseUrl: string; token: string } {
  const { baseUrl, token } = env.kashios;
  if (!baseUrl) {
    throw new HttpError(500, 'KASHIOS_API_BASE_URL is not configured');
  }
  if (!token) {
    throw new HttpError(500, 'KASHIOS_API_TOKEN is not configured');
  }
  return { baseUrl, token };
}

export interface KashioFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Sobrescribe el timeout por request (ms). */
  timeoutMs?: number;
}

export async function kashioFetch<T = unknown>(
  pathname: string,
  options: KashioFetchOptions = {},
): Promise<T> {
  const { baseUrl, token } = ensureConfig();
  const url = `${baseUrl}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
  const timeoutMs = options.timeoutMs ?? env.kashios.timeoutMs;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new HttpError(
        response.status === 404 ? 404 : 502,
        `KashioOS request failed (${response.status}) for ${url}`,
        text ? { upstream: text.slice(0, 500) } : undefined,
      );
    }

    const text = await response.text();
    if (!text) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new HttpError(502, `KashioOS returned non-JSON body for ${url}`);
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new HttpError(504, `KashioOS request timed out after ${timeoutMs}ms`);
    }
    const message = error instanceof Error ? error.message : 'Unknown network error';
    throw new HttpError(502, `KashioOS request error: ${message}`);
  } finally {
    clearTimeout(timer);
  }
}

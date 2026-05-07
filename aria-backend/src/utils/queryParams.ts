/**
 * Helpers para leer `req.query` de Express (valores `string | string[] | undefined`).
 */

export function firstQueryString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) {
    const first = value[0];
    if (first === undefined || first === null) return undefined;
    return String(first);
  }
  if (typeof value === 'object') return undefined;
  return String(value);
}

export function parsePositiveInt(
  value: unknown,
  fallback: number,
  options?: { min?: number; max?: number },
): number {
  const raw = firstQueryString(value);
  const n = raw === undefined ? NaN : parseInt(raw, 10);
  if (Number.isNaN(n)) return fallback;
  let out = n;
  if (options?.min !== undefined) out = Math.max(options.min, out);
  if (options?.max !== undefined) out = Math.min(options.max, out);
  return out;
}

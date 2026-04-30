/** Limpia un nombre de archivo para usarlo como sufijo de objeto en GCS. */
export function sanitizeFileName(filename: string): string {
  return String(filename)
    .replace(/[\\/]/g, '-')
    .replace(/\s+/g, '_')
    .trim();
}

/** Sanitiza nombres con tildes para slug de archivo. Mantiene caracteres comunes. */
export function safeSlug(value: string, opts?: { allowAccents?: boolean }): string {
  const allow = opts?.allowAccents !== false;
  const pattern = allow ? /[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s\-_]/g : /[^a-zA-Z0-9\s\-_]/g;
  return String(value).replace(pattern, '').replace(/\s+/g, '_');
}

/** Sanitiza una versión tipo `v1.0` → solo letras, dígitos, punto y guion bajo. */
export function safeVersion(value: string): string {
  return String(value).replace(/[^a-zA-Z0-9._]/g, '');
}

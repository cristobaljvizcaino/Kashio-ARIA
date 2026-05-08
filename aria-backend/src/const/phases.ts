/**
 * Catálogo de las 8 fases del PDLC alineadas con KashioOS (`phaseNumber` 1–8).
 * Sustituye el modelo legacy de gates G0–G5. Documentado en
 * `aria-backend/docs/Migracion_Gate_a_Fase.md`.
 */

export const MIN_PHASE = 1;
export const MAX_PHASE = 8;

export const PHASE_LABELS: Readonly<Record<number, string>> = {
  1: 'Research',
  2: 'Analysis',
  3: 'Design',
  4: 'Frontend Development',
  5: 'Backend Development',
  6: 'Testing',
  7: 'Deployment',
  8: 'Monitoring',
};

export function getPhaseLabel(phase: number): string {
  return PHASE_LABELS[phase] ?? `Phase ${phase}`;
}

export function isValidPhase(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= MIN_PHASE &&
    value <= MAX_PHASE
  );
}

/**
 * Interpreta `phase` numérica desde body JSON: número entero 1–8 o string `"3"`.
 * Devuelve `null` si no es válido.
 */
export function coerceToPhaseNumber(value: unknown): number | null {
  if (typeof value === 'number' && isValidPhase(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = parseInt(value.trim(), 10);
    if (!Number.isNaN(n) && isValidPhase(n)) return n;
  }
  return null;
}

/**
 * Mapea la etiqueta KashioOS (ej. `Design`, `research`) al número 1–8.
 * Comparación insensible a mayúsculas. Devuelve `null` si no coincide con ninguna fase.
 */
export function phaseNumberFromLabel(label: string): number | null {
  const key = label.trim().toLowerCase();
  if (!key) return null;
  for (let i = MIN_PHASE; i <= MAX_PHASE; i++) {
    if (PHASE_LABELS[i]!.toLowerCase() === key) return i;
  }
  return null;
}

/** Carpeta GCS canónica para el bucket `karia-library-files` (`Output/Phase-{n}/`). */
export function getPhaseStorageFolder(phase: number): string {
  return `Phase-${phase}`;
}

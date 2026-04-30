/**
 * Construye un `SET` para `UPDATE` a partir de un mapeo `camelCase → snake_case`
 * y un objeto de cambios. Devuelve la lista de cláusulas, los valores y el
 * próximo índice de parámetro disponible.
 */
export function buildSetClauses<T extends Record<string, unknown>>(
  fieldMap: Record<keyof T & string, string>,
  updates: Partial<T>,
  startIdx = 1,
): { clauses: string[]; values: unknown[]; nextIdx: number } {
  const clauses: string[] = [];
  const values: unknown[] = [];
  let idx = startIdx;

  for (const [jsKey, dbKey] of Object.entries(fieldMap)) {
    const value = updates[jsKey as keyof T];
    if (value !== undefined) {
      clauses.push(`${dbKey} = $${idx}`);
      values.push(value);
      idx++;
    }
  }

  return { clauses, values, nextIdx: idx };
}

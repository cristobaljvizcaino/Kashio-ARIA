export const LIBRARY_CATEGORIES = ['Contexto', 'Output', 'Prompt', 'Template'] as const;
export type LibraryCategory = (typeof LIBRARY_CATEGORIES)[number];

export function isLibraryCategory(value: unknown): value is LibraryCategory {
  return typeof value === 'string' && (LIBRARY_CATEGORIES as readonly string[]).includes(value);
}

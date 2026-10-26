export function formatSentenceValue(value: string | null | undefined): string {
  const normalized = value?.trim();

  if (!normalized || normalized === '-') {
    return '-';
  }

  const lower = normalized.toLocaleLowerCase('es-CO');
  return lower.charAt(0).toLocaleUpperCase('es-CO') + lower.slice(1);
}
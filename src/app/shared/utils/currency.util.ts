const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function parseCurrencyToNumber(
  value: string | number | null | undefined,
): number | null {
  if (value == null || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = value
    .trim()
    .replace(/\s/g, '')
    .replace(/\$/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  if (!normalized || !/^-?\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }

  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}

export function formatCurrencyValue(
  value: string | number | null | undefined,
): string {
  if (value == null || value === '' || value === '-') {
    return '-';
  }

  const numeric = parseCurrencyToNumber(value);
  if (numeric == null) {
    return '-';
  }

  return currencyFormatter.format(numeric);
}

export function formatCurrencyInput(
  value: string | number | null | undefined,
): string {
  const formatted = formatCurrencyValue(value);
  return formatted === '-' ? '' : formatted;
}

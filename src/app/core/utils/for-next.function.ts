/**
 * Itera un arreglo con índice, sin forEach ni for-of.
 */
export function forNext<T>(
  items: T[] | null | undefined,
  callback: (item: T, index: number) => void,
): void {
  if (!items?.length) {
    return;
  }

  const length = items.length;

  for (let i = 0; i < length; i++) {
    callback(items[i], i);
  }
}

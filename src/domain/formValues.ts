import type { FieldValue, FormValues } from './schema';

function sameValue(a: FieldValue | undefined, b: FieldValue | undefined): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => item === b[index]);
  }
  return a === b;
}

/** Имена полей, значения которых различаются. */
export function diffValues(a: FormValues, b: FormValues): string[] {
  const names = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...names].filter((name) => !sameValue(a[name], b[name]));
}

export function valuesEqual(a: FormValues, b: FormValues): boolean {
  return diffValues(a, b).length === 0;
}

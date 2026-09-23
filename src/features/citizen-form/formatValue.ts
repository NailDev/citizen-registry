import type { FieldSchema, FieldValue } from '@/domain/schema';
import { optionLabel } from '@/domain/dictionaries';
import { formatDate } from '@/shared/lib/format';

export function formatFieldValue(field: FieldSchema, value: FieldValue | undefined): string {
  if (value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет';

  const label = (item: string): string =>
    'options' in field ? optionLabel(field.options, item) : item;

  if (Array.isArray(value)) return value.map(label).join(', ');
  if (field.kind === 'date') return value ? formatDate(value) : '';
  return field.kind === 'select' || field.kind === 'radio' ? label(value) : value;
}

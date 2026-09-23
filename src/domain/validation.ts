import { todayIso } from '@/shared/lib/date';
import {
  isFieldVisible,
  type FieldSchema,
  type FieldValue,
  type FormSection,
  type FormValues,
  type InputField,
} from './schema';

const INPUT_KINDS: ReadonlyArray<FieldSchema['kind']> = [
  'text',
  'email',
  'tel',
  'date',
  'number',
  'textarea',
];

function isInputField(field: FieldSchema): field is InputField {
  return INPUT_KINDS.includes(field.kind);
}

function isEmpty(value: FieldValue | undefined): boolean {
  if (value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'boolean') return !value;
  return value.length === 0;
}

export function validateField(
  field: FieldSchema,
  value: FieldValue | undefined,
  values: FormValues,
): string | null {
  if (!isFieldVisible(field, values)) return null;

  if (isEmpty(value)) {
    return field.required ? (field.requiredMessage ?? 'Обязательное поле') : null;
  }

  if (typeof value !== 'string' || !isInputField(field)) return null;

  const text = value.trim();

  if (field.pattern && !field.pattern.regex.test(text)) return field.pattern.message;

  if (field.kind === 'number') {
    const number = Number(text.replace(',', '.'));
    if (Number.isNaN(number)) return 'Введите число';
    if (field.min !== undefined && number < field.min) return `Не меньше ${field.min}`;
    if (field.max !== undefined && number > field.max) return `Не больше ${field.max}`;
  }

  if (field.kind === 'date') {
    if (field.maxDate === 'today' && text > todayIso()) return 'Дата не может быть в будущем';
    if (field.minDate && text < field.minDate) return 'Слишком ранняя дата';
  }

  return null;
}

export function validateSections(
  sections: readonly FormSection[],
  values: FormValues,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const section of sections) {
    for (const field of section.fields) {
      const error = validateField(field, values[field.name], values);
      if (error) errors[field.name] = error;
    }
  }
  return errors;
}

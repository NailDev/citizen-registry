import { useCallback, useMemo, useState } from 'react';
import { valuesEqual } from '@/domain/formValues';
import {
  FORM_SECTIONS,
  getSections,
  type FieldValue,
  type FormValues,
} from '@/domain/schema';
import { validateSections } from '@/domain/validation';

export interface CitizenForm {
  values: FormValues;
  /** Все ошибки формы, включая ещё не показанные пользователю. */
  errors: Record<string, string>;
  /** Ошибки только тех полей, которых пользователь уже коснулся или которые проверены явно. */
  visibleErrors: Record<string, string>;
  isDirty: boolean;
  setValue: (name: string, value: FieldValue) => void;
  touch: (name: string) => void;
  /** Проверяет секции (по умолчанию все), показывает ошибки и возвращает true, если их нет. */
  validate: (sectionIds?: readonly string[]) => boolean;
  /** Принимает новые значения как «сохранённые» — сбрасывает признак изменений. */
  reset: (values: FormValues) => void;
}

export function useCitizenForm(initialValues: FormValues): CitizenForm {
  const [baseline, setBaseline] = useState(initialValues);
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState<ReadonlySet<string>>(() => new Set());

  const errors = useMemo(() => validateSections(FORM_SECTIONS, values), [values]);
  const visibleErrors = useMemo(
    () => Object.fromEntries(Object.entries(errors).filter(([name]) => touched.has(name))),
    [errors, touched],
  );
  const isDirty = useMemo(() => !valuesEqual(baseline, values), [baseline, values]);

  const setValue = useCallback((name: string, value: FieldValue) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const touch = useCallback((name: string) => {
    setTouched((prev) => (prev.has(name) ? prev : new Set(prev).add(name)));
  }, []);

  const validate = useCallback(
    (sectionIds?: readonly string[]) => {
      const sections = sectionIds ? getSections(sectionIds) : FORM_SECTIONS;
      setTouched((prev) => {
        const next = new Set(prev);
        for (const section of sections) {
          for (const field of section.fields) next.add(field.name);
        }
        return next;
      });
      return Object.keys(validateSections(sections, values)).length === 0;
    },
    [values],
  );

  const reset = useCallback((next: FormValues) => {
    setBaseline(next);
    setValues(next);
    setTouched(new Set());
  }, []);

  return { values, errors, visibleErrors, isDirty, setValue, touch, validate, reset };
}

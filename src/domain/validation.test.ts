import { describe, expect, it } from 'vitest';
import { FORM_SECTIONS, buildInitialValues, type FieldSchema } from './schema';
import { validateField, validateSections } from './validation';

const requiredText: FieldSchema = { name: 'x', label: 'X', kind: 'text', required: true };

describe('validateField', () => {
  it('требует заполнить обязательное поле', () => {
    expect(validateField(requiredText, '   ', {})).toBe('Обязательное поле');
  });

  it('пропускает пустое необязательное поле', () => {
    expect(validateField({ ...requiredText, required: false }, '', {})).toBeNull();
  });

  it('проверяет формат по шаблону', () => {
    const field: FieldSchema = {
      name: 'inn',
      label: 'ИНН',
      kind: 'text',
      pattern: { regex: /^\d{12}$/, message: '12 цифр' },
    };
    expect(validateField(field, '123', {})).toBe('12 цифр');
    expect(validateField(field, '123456789012', {})).toBeNull();
  });

  it('проверяет границы числа', () => {
    const field: FieldSchema = { name: 'n', label: 'N', kind: 'number', min: 1, max: 5 };
    expect(validateField(field, '0', {})).toBe('Не меньше 1');
    expect(validateField(field, '6', {})).toBe('Не больше 5');
    expect(validateField(field, 'abc', {})).toBe('Введите число');
    expect(validateField(field, '3', {})).toBeNull();
  });

  it('не принимает дату в будущем', () => {
    const field: FieldSchema = { name: 'd', label: 'D', kind: 'date', maxDate: 'today' };
    expect(validateField(field, '2999-01-01', {})).toBe('Дата не может быть в будущем');
    expect(validateField(field, '2000-01-01', {})).toBeNull();
  });

  it('не проверяет скрытые поля', () => {
    const hidden: FieldSchema = { ...requiredText, visibleIf: () => false };
    expect(validateField(hidden, '', {})).toBeNull();
  });

  it('требует отметить обязательный чекбокс', () => {
    const field: FieldSchema = { name: 'c', label: 'C', kind: 'checkbox', required: true, requiredMessage: 'Нужно согласие' };
    expect(validateField(field, false, {})).toBe('Нужно согласие');
    expect(validateField(field, true, {})).toBeNull();
  });
});

describe('validateSections', () => {
  it('находит обязательные поля в пустой форме', () => {
    const errors = validateSections(FORM_SECTIONS, buildInitialValues());
    expect(errors).toHaveProperty('lastName');
    expect(errors).toHaveProperty('phone');
    expect(errors).toHaveProperty('consentPd');
  });

  it('требует фактический адрес, только если он отличается от адреса регистрации', () => {
    const same = validateSections(FORM_SECTIONS, buildInitialValues({ sameAddress: true }));
    const different = validateSections(FORM_SECTIONS, buildInitialValues({ sameAddress: false }));
    expect(same).not.toHaveProperty('factCity');
    expect(different).toHaveProperty('factCity');
  });
});

import { FORM_SECTIONS, getSections, type FormValues } from '@/domain/schema';

export interface WizardStep {
  id: string;
  title: string;
  sectionIds: readonly string[];
}

export const WIZARD_STEPS: readonly WizardStep[] = [
  { id: 'basic', title: 'Основные сведения', sectionIds: ['personal', 'documents'] },
  { id: 'contacts', title: 'Контакты и адрес', sectionIds: ['contacts', 'address'] },
  {
    id: 'social',
    title: 'Социальный статус',
    sectionIds: ['household', 'employment', 'benefits', 'waste'],
  },
  { id: 'review', title: 'Проверка', sectionIds: [] },
];

export const REVIEW_STEP_INDEX = WIZARD_STEPS.length - 1;

/** Индекс первого шага, в котором есть ошибочное поле. -1, если ошибок нет. */
export function findFirstInvalidStep(errors: Record<string, string>): number {
  return WIZARD_STEPS.findIndex((step) =>
    getSections(step.sectionIds).some((section) => section.fields.some((field) => errors[field.name])),
  );
}

export function stepIndexForSection(sectionId: string): number {
  return WIZARD_STEPS.findIndex((step) => step.sectionIds.includes(sectionId));
}

export interface ReviewGroup {
  sectionId: string;
  title: string;
  rows: Array<{ label: string; value: string }>;
}

export function buildReview(
  values: FormValues,
  format: (name: string, value: FormValues[string] | undefined) => string,
  isVisible: (name: string) => boolean,
): ReviewGroup[] {
  return FORM_SECTIONS.map((section) => ({
    sectionId: section.id,
    title: section.title,
    rows: section.fields
      .filter((field) => isVisible(field.name))
      .map((field) => ({ label: field.label, value: format(field.name, values[field.name]) }))
      .filter((row) => row.value !== '' && row.value !== 'Нет'),
  })).filter((group) => group.rows.length > 0);
}

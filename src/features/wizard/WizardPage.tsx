import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FIELD_BY_NAME, buildInitialValues, isFieldVisible } from '@/domain/schema';
import { SectionForm } from '@/features/citizen-form/SectionForm';
import { formatFieldValue } from '@/features/citizen-form/formatValue';
import { useCitizenForm } from '@/features/citizen-form/useCitizenForm';
import { useCreateCitizen } from '@/features/registry/queries';
import { cx } from '@/shared/lib/cx';
import { useUnsavedChangesGuard } from '@/shared/lib/useUnsavedChangesGuard';
import { Button } from '@/shared/ui/Button';
import { CheckIcon } from '@/shared/ui/icons';
import { PageHeader } from '@/shared/ui/PageHeader';
import {
  REVIEW_STEP_INDEX,
  WIZARD_STEPS,
  buildReview,
  findFirstInvalidStep,
  stepIndexForSection,
} from './steps';
import './wizard.css';

export function WizardPage() {
  const [initialValues] = useState(() => buildInitialValues());
  const form = useCitizenForm(initialValues);
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [createdId, setCreatedId] = useState<number | null>(null);
  const mutation = useCreateCitizen();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useUnsavedChangesGuard(form.isDirty && createdId === null);

  useEffect(() => {
    if (createdId !== null) navigate(`/registry/${createdId}`, { state: { created: true } });
  }, [createdId, navigate]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const current = WIZARD_STEPS[step];
  const isReview = step === REVIEW_STEP_INDEX;

  const goTo = (index: number): void => {
    setStep(index);
    setFurthest((prev) => Math.max(prev, index));
  };

  const handleNext = (): void => {
    if (current && form.validate(current.sectionIds)) goTo(step + 1);
  };

  const handleSubmit = (): void => {
    if (!form.validate()) {
      const broken = findFirstInvalidStep(form.errors);
      if (broken >= 0) setStep(broken);
      return;
    }
    mutation.mutate(form.values, { onSuccess: (created) => setCreatedId(created.id) });
  };

  const review = useMemo(
    () =>
      isReview
        ? buildReview(
            form.values,
            (name, value) => {
              const field = FIELD_BY_NAME.get(name);
              return field ? formatFieldValue(field, value) : '';
            },
            (name) => {
              const field = FIELD_BY_NAME.get(name);
              return field ? isFieldVisible(field, form.values) : false;
            },
          )
        : [],
    [isReview, form.values],
  );

  const errorCount = Object.keys(form.errors).length;

  return (
    <>
      <PageHeader
        title="Новая карточка"
        description="Заполните сведения по шагам. Обязательные поля отмечены звёздочкой."
        actions={
          <Link to="/registry" className="btn btn--secondary">
            К картотеке
          </Link>
        }
      />
      <div className="panel wizard">
        <ol className="stepper" aria-label="Шаги создания карточки">
          {WIZARD_STEPS.map((item, index) => {
            const done = index < step;
            return (
              <li key={item.id} className="stepper__item">
                <button
                  type="button"
                  className={cx('stepper__btn', index === step && 'stepper__btn--current', done && 'stepper__btn--done')}
                  aria-current={index === step ? 'step' : undefined}
                  disabled={index > furthest}
                  onClick={() => goTo(index)}
                >
                  <span className="stepper__mark">{done ? <CheckIcon width={14} height={14} /> : index + 1}</span>
                  {item.title}
                </button>
              </li>
            );
          })}
        </ol>

        <div className="wizard__body">
          <h2 ref={headingRef} tabIndex={-1} className="wizard__title">
            {current?.title}
          </h2>

          {current && !isReview && (
            <SectionForm sectionIds={current.sectionIds} form={form} idPrefix="wizard" />
          )}

          {isReview && (
            <div className="review">
              {errorCount > 0 && (
                <p className="banner banner--warn" role="alert">
                  В карточке {errorCount} незаполненных или неверных полей. Вернитесь к нужным шагам.
                </p>
              )}
              {review.map((group) => (
                <section key={group.sectionId} className="review__group">
                  <div className="review__head">
                    <h3>{group.title}</h3>
                    <Button variant="ghost" size="sm" onClick={() => goTo(stepIndexForSection(group.sectionId))}>
                      Изменить
                    </Button>
                  </div>
                  <dl className="review__list">
                    {group.rows.map((row) => (
                      <div key={row.label}>
                        <dt>{row.label}</dt>
                        <dd>{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
              {mutation.isError && (
                <p className="banner banner--warn" role="alert">
                  Не удалось создать карточку. Попробуйте ещё раз.
                </p>
              )}
            </div>
          )}
        </div>

        <footer className="wizard__footer">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
            Назад
          </Button>
          {isReview ? (
            <Button variant="primary" disabled={mutation.isPending} onClick={handleSubmit}>
              {mutation.isPending ? 'Создаём…' : 'Создать карточку'}
            </Button>
          ) : (
            <Button variant="primary" onClick={handleNext}>
              Далее
            </Button>
          )}
        </footer>
      </div>
    </>
  );
}

import { memo } from 'react';
import type { FieldSchema, FieldValue } from '@/domain/schema';

interface FieldControlProps {
  field: FieldSchema;
  value: FieldValue | undefined;
  error?: string;
  idPrefix: string;
  onChange: (name: string, value: FieldValue) => void;
  onBlur: (name: string) => void;
}

function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) {
    return (
      <p id={id} className="field__msg field__msg--error">
        {error}
      </p>
    );
  }
  return hint ? (
    <p id={id} className="field__msg">
      {hint}
    </p>
  ) : null;
}

/**
 * Один компонент отрисовывает любое поле по его схеме. Обёрнут в memo: при вводе в одно поле
 * остальные ~70 полей формы не перерисовываются.
 */
export const FieldControl = memo(function FieldControl({
  field,
  value,
  error,
  idPrefix,
  onChange,
  onBlur,
}: FieldControlProps) {
  const id = `${idPrefix}-${field.name}`;
  const messageId = `${id}-msg`;
  const describedBy = error || field.hint ? messageId : undefined;
  const invalid = error ? true : undefined;
  const required = field.required ? true : undefined;
  const label = (
    <>
      {field.label}
      {field.required && (
        <span className="field__req" aria-hidden="true">
          *
        </span>
      )}
    </>
  );
  const message = <FieldMessage id={messageId} error={error} hint={field.hint} />;

  switch (field.kind) {
    case 'checkbox':
    case 'switch':
      return (
        <div className="field">
          <label className={field.kind === 'switch' ? 'switch' : 'checkbox'}>
            <input
              id={id}
              type="checkbox"
              role={field.kind === 'switch' ? 'switch' : undefined}
              checked={value === true}
              aria-invalid={invalid}
              aria-required={required}
              aria-describedby={describedBy}
              onChange={(event) => onChange(field.name, event.target.checked)}
              onBlur={() => onBlur(field.name)}
            />
            {field.kind === 'switch' && <span className="switch__track" aria-hidden="true" />}
            <span>{label}</span>
          </label>
          {message}
        </div>
      );

    case 'radio':
    case 'multiselect': {
      const multiple = field.kind === 'multiselect';
      const selected = Array.isArray(value) ? value : [];
      return (
        <fieldset className="field" aria-describedby={describedBy}>
          <legend className="field__label">{label}</legend>
          <div className="choice-group">
            {field.options.map((option) => {
              const checked = multiple ? selected.includes(option.value) : value === option.value;
              const toggle = (): void => {
                if (!multiple) return onChange(field.name, option.value);
                onChange(
                  field.name,
                  checked ? selected.filter((item) => item !== option.value) : [...selected, option.value],
                );
              };
              return (
                <label key={option.value} className="choice">
                  <input
                    type={multiple ? 'checkbox' : 'radio'}
                    name={id}
                    value={option.value}
                    checked={checked}
                    onChange={toggle}
                    onBlur={() => onBlur(field.name)}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
          {message}
        </fieldset>
      );
    }

    case 'select':
      return (
        <div className="field">
          <label htmlFor={id} className="field__label">
            {label}
          </label>
          <select
            id={id}
            className="select"
            value={typeof value === 'string' ? value : ''}
            aria-invalid={invalid}
            aria-required={required}
            aria-describedby={describedBy}
            onChange={(event) => onChange(field.name, event.target.value)}
            onBlur={() => onBlur(field.name)}
          >
            <option value="">Не выбрано</option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {message}
        </div>
      );

    case 'textarea':
      return (
        <div className="field">
          <label htmlFor={id} className="field__label">
            {label}
          </label>
          <textarea
            id={id}
            className="textarea"
            value={typeof value === 'string' ? value : ''}
            placeholder={field.placeholder}
            aria-invalid={invalid}
            aria-required={required}
            aria-describedby={describedBy}
            onChange={(event) => onChange(field.name, event.target.value)}
            onBlur={() => onBlur(field.name)}
          />
          {message}
        </div>
      );

    default:
      return (
        <div className="field">
          <label htmlFor={id} className="field__label">
            {label}
          </label>
          <input
            id={id}
            className="input"
            type={field.kind}
            inputMode={field.kind === 'number' ? 'decimal' : field.kind === 'tel' ? 'tel' : undefined}
            value={typeof value === 'string' ? value : ''}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            autoComplete="off"
            aria-invalid={invalid}
            aria-required={required}
            aria-describedby={describedBy}
            onChange={(event) => onChange(field.name, event.target.value)}
            onBlur={() => onBlur(field.name)}
          />
          {message}
        </div>
      );
  }
});

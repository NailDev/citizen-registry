import { getSections, isFieldVisible } from '@/domain/schema';
import { FieldControl } from './FieldControl';
import type { CitizenForm } from './useCitizenForm';

interface SectionFormProps {
  sectionIds: readonly string[];
  form: CitizenForm;
  idPrefix: string;
}

export function SectionForm({ sectionIds, form, idPrefix }: SectionFormProps) {
  return (
    <div className="form-region">
      {getSections(sectionIds).map((section) => (
        <section key={section.id} className="form-section" aria-labelledby={`${idPrefix}-${section.id}`}>
          <h3 id={`${idPrefix}-${section.id}`} className="form-section__title">
            {section.title}
          </h3>
          {section.description && <p className="form-section__desc">{section.description}</p>}
          <div className="form-grid">
            {section.fields
              .filter((field) => isFieldVisible(field, form.values))
              .map((field) => (
                <div key={field.name} className={`span-${field.span ?? 1}`}>
                  <FieldControl
                    field={field}
                    value={form.values[field.name]}
                    error={form.visibleErrors[field.name]}
                    idPrefix={idPrefix}
                    onChange={form.setValue}
                    onBlur={form.touch}
                  />
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

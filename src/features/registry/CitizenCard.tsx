import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CATEGORY_OPTIONS, STATUS_OPTIONS, optionLabel } from '@/domain/dictionaries';
import type { CitizenDetail } from '@/domain/citizen';
import { getSections } from '@/domain/schema';
import { SectionForm } from '@/features/citizen-form/SectionForm';
import { useCitizenForm } from '@/features/citizen-form/useCitizenForm';
import { cx } from '@/shared/lib/cx';
import { todayIso } from '@/shared/lib/date';
import { calcAge, formatDate, initials, plural } from '@/shared/lib/format';
import { useUnsavedChangesGuard } from '@/shared/lib/useUnsavedChangesGuard';
import { Button } from '@/shared/ui/Button';
import { CitizenStatusBadge } from '@/shared/ui/CitizenStatusBadge';
import { ChevronLeftIcon } from '@/shared/ui/icons';
import { EmptyState, ErrorState } from '@/shared/ui/States';
import {
  AppealsTable,
  EducationTable,
  FamilyTable,
  FilesTable,
  HistoryTimeline,
} from './RelatedTables';
import { useCitizen, useUpdateCitizen } from './queries';

interface TabDefinition {
  id: string;
  label: string;
  /** Секции формы, которые показывает вкладка. Вкладки со связанными таблицами могут быть без секций. */
  sectionIds: readonly string[];
}

const TABS: readonly TabDefinition[] = [
  { id: 'general', label: 'Общие сведения', sectionIds: ['personal', 'documents'] },
  { id: 'contacts', label: 'Контакты и адрес', sectionIds: ['contacts', 'address'] },
  { id: 'family', label: 'Семья и жильё', sectionIds: ['household'] },
  { id: 'work', label: 'Образование и работа', sectionIds: ['employment'] },
  { id: 'benefits', label: 'Льготы и услуги', sectionIds: ['benefits', 'waste'] },
  { id: 'appeals', label: 'Обращения', sectionIds: [] },
  { id: 'files', label: 'Документы', sectionIds: [] },
  { id: 'history', label: 'История', sectionIds: [] },
];

const TAB_FIELD_NAMES: ReadonlyMap<string, ReadonlySet<string>> = new Map(
  TABS.map((tab) => [
    tab.id,
    new Set(getSections(tab.sectionIds).flatMap((section) => section.fields.map((field) => field.name))),
  ]),
);

const EMPTY_SET: ReadonlySet<string> = new Set();

export function CitizenCardRoute() {
  const { id } = useParams();
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 1) {
    return (
      <section className="registry__card panel">
        <EmptyState title="Некорректный номер карточки" />
      </section>
    );
  }
  return <CitizenCard id={numericId} />;
}

function CitizenCard({ id }: { id: number }) {
  const { data, isPending, isError, error, refetch } = useCitizen(id);
  // Активная вкладка живёт выше карточки: при переходе к другому человеку оператор остаётся в том же разделе.
  const [activeTab, setActiveTab] = useState(TABS[0]?.id ?? 'general');

  return (
    <section className="registry__card panel" aria-label="Карточка гражданина">
      {isPending && (
        <div className="card__loading" aria-busy="true" role="status">
          <div className="skeleton" style={{ height: 72 }} />
          <div className="skeleton" style={{ height: 40 }} />
          <div className="skeleton" style={{ height: 240 }} />
        </div>
      )}
      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}
      {data && (
        <CitizenCardView key={data.id} detail={data} activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </section>
  );
}

interface CitizenCardViewProps {
  detail: CitizenDetail;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

function CitizenCardView({ detail, activeTab, onTabChange }: CitizenCardViewProps) {
  const form = useCitizenForm(detail.values);
  const mutation = useUpdateCitizen(detail.id);
  const location = useLocation();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useUnsavedChangesGuard(form.isDirty);

  const createdNow = (location.state as { created?: boolean } | null)?.created === true;
  const { values } = form;
  const fullName = [values.lastName, values.firstName, values.middleName]
    .filter((part) => typeof part === 'string' && part)
    .join(' ');
  const birthDate = typeof values.birthDate === 'string' ? values.birthDate : '';
  const category = typeof values.category === 'string' ? values.category : '';
  const status = STATUS_OPTIONS.find((option) => option.value === values.status)?.value ?? 'pending';

  const today = todayIso();
  const openAppeals = detail.appeals.filter((appeal) => appeal.status !== 'resolved');
  const overdue = openAppeals.filter((appeal) => appeal.deadline < today).length;

  const errorCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tab of TABS) {
      const names = TAB_FIELD_NAMES.get(tab.id) ?? EMPTY_SET;
      counts.set(tab.id, Object.keys(form.visibleErrors).filter((name) => names.has(name)).length);
    }
    return counts;
  }, [form.visibleErrors]);

  const handleSave = (): void => {
    if (!form.validate()) {
      setSaveFailed(true);
      const firstBroken = TABS.find((tab) =>
        Object.keys(form.errors).some((name) => TAB_FIELD_NAMES.get(tab.id)?.has(name)),
      );
      if (firstBroken) onTabChange(firstBroken.id);
      return;
    }
    setSaveFailed(false);
    mutation.mutate(form.values, { onSuccess: (saved) => form.reset(saved.values) });
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0 && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const nextIndex =
      event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1 : (index + step + TABS.length) % TABS.length;
    const next = TABS[nextIndex];
    if (!next) return;
    onTabChange(next.id);
    tabRefs.current[next.id]?.focus();
  };

  const tab = TABS.find((item) => item.id === activeTab) ?? TABS[0];
  const errorTotal = Object.keys(form.errors).length;
  let statusMessage = '';
  if (mutation.isError) statusMessage = 'Не удалось сохранить. Попробуйте ещё раз.';
  else if (saveFailed && errorTotal > 0)
    statusMessage = `Исправьте ${errorTotal} ${plural(errorTotal, ['ошибку', 'ошибки', 'ошибок'])} перед сохранением.`;
  else if (form.isDirty) statusMessage = 'Есть несохранённые изменения';
  else if (mutation.isSuccess) statusMessage = 'Изменения сохранены';

  return (
    <article className="card">
      <header className="card__head">
        <Link to={`/registry${location.search}`} className="btn btn--ghost btn--sm card__back">
          <ChevronLeftIcon />К списку
        </Link>
        <div className="card__identity">
          <span className="card__avatar" aria-hidden="true">
            {initials(fullName)}
          </span>
          <div className="card__title">
            <h2>{fullName || 'Новая карточка'}</h2>
            <p>
              № {detail.id}
              {birthDate && ` · ${calcAge(birthDate)} ${plural(calcAge(birthDate), ['год', 'года', 'лет'])}`}
              {category && ` · ${optionLabel(CATEGORY_OPTIONS, category)}`}
            </p>
          </div>
          <CitizenStatusBadge status={status} />
        </div>
        <dl className="card__stats">
          <div>
            <dt>Открытые обращения</dt>
            <dd>{openAppeals.length}</dd>
          </div>
          <div className={cx(overdue > 0 && 'card__stat--alert')}>
            <dt>Просрочено</dt>
            <dd>{overdue}</dd>
          </div>
          <div>
            <dt>В картотеке с</dt>
            <dd>{formatDate(detail.registeredAt)}</dd>
          </div>
          <div>
            <dt>Последний контакт</dt>
            <dd>{formatDate(detail.lastContactAt)}</dd>
          </div>
        </dl>
      </header>

      {createdNow && !bannerDismissed && (
        <div className="banner banner--ok" role="status">
          Карточка создана и добавлена в картотеку.
          <button type="button" className="banner__close" onClick={() => setBannerDismissed(true)}>
            Скрыть
          </button>
        </div>
      )}

      <div className="tabs" role="tablist" aria-label="Разделы карточки">
        {TABS.map((item, index) => {
          const count = errorCounts.get(item.id) ?? 0;
          const selected = item.id === activeTab;
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[item.id] = node;
              }}
              id={`tab-${item.id}`}
              type="button"
              role="tab"
              className={cx('tabs__tab', selected && 'tabs__tab--active')}
              aria-selected={selected}
              aria-controls={`panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onTabChange(item.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              {item.label}
              {item.id === 'appeals' && <span className="tabs__count">{detail.appeals.length}</span>}
              {count > 0 && (
                <span className="tabs__error" aria-label={`Ошибок: ${count}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        id={`panel-${tab?.id}`}
        className="card__body"
        role="tabpanel"
        aria-labelledby={`tab-${tab?.id}`}
      >
        {tab?.id === 'work' && <EducationTable rows={detail.education} />}
        {tab && tab.sectionIds.length > 0 && (
          <SectionForm sectionIds={tab.sectionIds} form={form} idPrefix="card" />
        )}
        {tab?.id === 'family' && <FamilyTable rows={detail.family} />}
        {tab?.id === 'appeals' && <AppealsTable rows={detail.appeals} />}
        {tab?.id === 'files' && <FilesTable rows={detail.files} />}
        {tab?.id === 'history' && <HistoryTimeline events={detail.history} />}
      </div>

      <footer className="card__footer">
        <p className="card__status" role="status">
          {statusMessage}
        </p>
        <Button variant="ghost" disabled={!form.isDirty || mutation.isPending} onClick={() => form.reset(detail.values)}>
          Отменить
        </Button>
        <Button variant="primary" disabled={!form.isDirty || mutation.isPending} onClick={handleSave}>
          {mutation.isPending ? 'Сохраняем…' : 'Сохранить'}
        </Button>
      </footer>
    </article>
  );
}

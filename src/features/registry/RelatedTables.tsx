import type { ReactNode } from 'react';
import { APPEAL_STATUS_OPTIONS, optionLabel, type AppealStatus } from '@/domain/dictionaries';
import type {
  Appeal,
  CitizenFile,
  EducationRecord,
  FamilyMember,
  HistoryEvent,
} from '@/domain/citizen';
import { formatDate, formatDateTime, formatFileSize } from '@/shared/lib/format';
import { todayIso } from '@/shared/lib/date';
import { Badge, type BadgeTone } from '@/shared/ui/Badge';

interface DataTableProps<T extends { id: string }> {
  caption: string;
  rows: readonly T[];
  emptyText: string;
  columns: ReadonlyArray<{ header: string; render: (row: T) => ReactNode }>;
}

function DataTable<T extends { id: string }>({ caption, rows, emptyText, columns }: DataTableProps<T>) {
  return (
    <section className="related">
      {rows.length === 0 ? (
        <>
          <h3 className="form-section__title">{caption}</h3>
          <p className="related__empty">{emptyText}</p>
        </>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <caption>{caption}</caption>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.header} scope="col">
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td key={column.header}>{column.render(row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function FamilyTable({ rows }: { rows: readonly FamilyMember[] }) {
  return (
    <DataTable
      caption="Члены семьи"
      rows={rows}
      emptyText="Сведения о членах семьи не внесены."
      columns={[
        { header: 'Степень родства', render: (row) => row.relation },
        { header: 'ФИО', render: (row) => row.fullName },
        { header: 'Дата рождения', render: (row) => formatDate(row.birthDate) },
        { header: 'Иждивенец', render: (row) => (row.dependent ? 'Да' : 'Нет') },
        { header: 'Телефон', render: (row) => row.phone || '—' },
      ]}
    />
  );
}

export function EducationTable({ rows }: { rows: readonly EducationRecord[] }) {
  return (
    <DataTable
      caption="Образование"
      rows={rows}
      emptyText="Сведения об образовании не внесены."
      columns={[
        { header: 'Уровень', render: (row) => row.level },
        { header: 'Учебное заведение', render: (row) => row.institution },
        { header: 'Специальность', render: (row) => row.specialty },
        { header: 'Годы', render: (row) => `${row.yearStart}–${row.yearEnd}` },
        { header: 'Документ', render: (row) => row.documentNumber },
      ]}
    />
  );
}

const APPEAL_TONES: Record<AppealStatus, BadgeTone> = {
  new: 'info',
  in_progress: 'warn',
  waiting: 'neutral',
  resolved: 'ok',
};

export function AppealsTable({ rows }: { rows: readonly Appeal[] }) {
  const today = todayIso();
  return (
    <DataTable
      caption="Обращения гражданина"
      rows={rows}
      emptyText="Обращений пока не было."
      columns={[
        { header: 'Номер', render: (row) => row.id },
        { header: 'Тема', render: (row) => row.topic },
        { header: 'Канал', render: (row) => row.channel },
        { header: 'Создано', render: (row) => formatDate(row.createdAt) },
        {
          header: 'Срок ответа',
          render: (row) =>
            row.status !== 'resolved' && row.deadline < today ? (
              <Badge tone="danger">{formatDate(row.deadline)} · просрочено</Badge>
            ) : (
              formatDate(row.deadline)
            ),
        },
        {
          header: 'Статус',
          render: (row) => (
            <Badge tone={APPEAL_TONES[row.status]}>
              {optionLabel(APPEAL_STATUS_OPTIONS, row.status)}
            </Badge>
          ),
        },
        { header: 'Исполнитель', render: (row) => row.executor },
      ]}
    />
  );
}

export function FilesTable({ rows }: { rows: readonly CitizenFile[] }) {
  return (
    <DataTable
      caption="Прикреплённые документы"
      rows={rows}
      emptyText="Документов нет."
      columns={[
        { header: 'Файл', render: (row) => row.name },
        { header: 'Тип', render: (row) => row.type },
        { header: 'Размер', render: (row) => formatFileSize(row.sizeKb) },
        { header: 'Загружен', render: (row) => formatDate(row.uploadedAt) },
      ]}
    />
  );
}

export function HistoryTimeline({ events }: { events: readonly HistoryEvent[] }) {
  return (
    <section className="related">
      <h3 className="form-section__title">История изменений</h3>
      <ol className="timeline">
        {events.map((event) => (
          <li key={event.id} className="timeline__item">
            <p className="timeline__action">{event.action}</p>
            <p className="timeline__meta">
              {formatDateTime(event.at)} · {event.author}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

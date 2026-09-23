import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CATEGORY_OPTIONS, GENDER_OPTIONS, optionLabel } from '@/domain/dictionaries';
import type { CitizenListItem, SortKey } from '@/domain/citizen';
import { cx } from '@/shared/lib/cx';
import { calcAge, formatDate, initials } from '@/shared/lib/format';
import { CitizenStatusBadge } from '@/shared/ui/CitizenStatusBadge';
import { SortIcon } from '@/shared/ui/icons';
import { EmptyState, ErrorState } from '@/shared/ui/States';
import type { RegistryFilters } from './filters';
import type { useCitizensInfinite } from './queries';

const ROW_HEIGHT = 60;
const OVERSCAN = 8;
const SKELETON_ROWS = 9;

interface Column {
  id: string;
  header: string;
  /** Значение grid-template-columns для колонки. */
  width: string;
  minWidth: number;
  sortKey?: SortKey;
  /** Показывать ли колонку, когда справа открыта карточка и список сжат. */
  compact?: boolean;
  render: (row: CitizenListItem, search: string) => ReactNode;
}

const COLUMNS: readonly Column[] = [
  {
    id: 'name',
    header: 'ФИО',
    width: 'minmax(220px, 2.4fr)',
    minWidth: 220,
    sortKey: 'fullName',
    compact: true,
    render: (row, search) => (
      <div className="person">
        <span className="person__avatar" aria-hidden="true">
          {initials(row.fullName)}
        </span>
        <span className="person__text">
          <Link
            className="person__name"
            to={`/registry/${row.id}${search}`}
            onClick={(event) => event.stopPropagation()}
          >
            {row.fullName}
          </Link>
          <span className="person__meta">№ {row.id} · {row.city}</span>
        </span>
      </div>
    ),
  },
  {
    id: 'birth',
    header: 'Дата рождения',
    width: '150px',
    minWidth: 150,
    sortKey: 'birthDate',
    render: (row) => (
      <>
        {formatDate(row.birthDate)}
        <span className="cell-muted"> · {calcAge(row.birthDate)} л.</span>
      </>
    ),
  },
  {
    id: 'gender',
    header: 'Пол',
    width: '96px',
    minWidth: 96,
    render: (row) => optionLabel(GENDER_OPTIONS, row.gender),
  },
  {
    id: 'region',
    header: 'Регион',
    width: 'minmax(170px, 1.5fr)',
    minWidth: 170,
    sortKey: 'region',
    render: (row) => row.region,
  },
  {
    id: 'category',
    header: 'Категория',
    width: 'minmax(150px, 1.2fr)',
    minWidth: 150,
    sortKey: 'category',
    render: (row) => optionLabel(CATEGORY_OPTIONS, row.category),
  },
  {
    id: 'status',
    header: 'Статус',
    width: '140px',
    minWidth: 140,
    sortKey: 'status',
    compact: true,
    render: (row) => <CitizenStatusBadge status={row.status} />,
  },
  {
    id: 'appeals',
    header: 'Обращения',
    width: '120px',
    minWidth: 120,
    sortKey: 'appealsOpen',
    render: (row) =>
      row.appealsOpen === 0 ? (
        <span className="cell-muted">нет открытых</span>
      ) : (
        <span className={cx('appeals', row.appealsOverdue > 0 && 'appeals--overdue')}>
          {row.appealsOpen} откр.{row.appealsOverdue > 0 && ` · ${row.appealsOverdue} проср.`}
        </span>
      ),
  },
];

interface CitizenTableProps {
  query: ReturnType<typeof useCitizensInfinite>;
  filters: RegistryFilters;
  selectedId: number | null;
  compact: boolean;
  onSort: (key: SortKey) => void;
  onResetFilters: () => void;
}

function ariaSort(column: Column, filters: RegistryFilters): 'ascending' | 'descending' | 'none' | undefined {
  if (!column.sortKey) return undefined;
  if (filters.sortBy !== column.sortKey) return 'none';
  return filters.sortDir === 'asc' ? 'ascending' : 'descending';
}

export function CitizenTable({
  query,
  filters,
  selectedId,
  compact,
  onSort,
  onResetFilters,
}: CitizenTableProps) {
  const { search } = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.total ?? 0;
  const columns = compact ? COLUMNS.filter((column) => column.compact) : COLUMNS;
  const template = columns.map((column) => column.width).join(' ');
  const minWidth = columns.reduce((sum, column) => sum + column.minWidth + 12, 32);

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  const virtualizer = useVirtualizer({
    count: hasNextPage ? rows.length + 1 : rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });
  const virtualItems = virtualizer.getVirtualItems();
  const lastVisibleIndex = virtualItems.at(-1)?.index;

  useEffect(() => {
    if (
      lastVisibleIndex !== undefined &&
      lastVisibleIndex >= rows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage();
    }
  }, [lastVisibleIndex, rows.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // При смене фильтров или сортировки список начинается сначала.
  const filterKey = `${filters.q}|${filters.statuses.join()}|${filters.category}|${filters.region}|${filters.gender}|${filters.ageFrom}|${filters.ageTo}|${filters.overdueOnly}|${filters.sortBy}|${filters.sortDir}`;
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [filterKey]);

  let body: ReactNode;
  if (query.isPending) {
    body = (
      <div aria-busy="true" aria-label="Загрузка списка">
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <div key={index} className="ctable__skeleton">
            <div className="skeleton" />
          </div>
        ))}
      </div>
    );
  } else if (query.isError) {
    body = <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  } else if (rows.length === 0) {
    body = (
      <EmptyState
        title="Никого не нашли"
        description="Под эти условия не подходит ни одна карточка. Ослабьте фильтры или проверьте написание."
        action={
          <button type="button" className="btn btn--secondary" onClick={onResetFilters}>
            Сбросить фильтры
          </button>
        }
      />
    );
  } else {
    body = (
      <div
        className="ctable__body"
        role="rowgroup"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualItems.map((item) => {
          const row = rows[item.index];
          const style = { transform: `translateY(${item.start}px)`, height: item.size };
          if (!row) {
            return (
              <div key={item.key} className="ctable__row ctable__row--loader" style={style} role="row">
                <div role="cell">Загружаем ещё…</div>
              </div>
            );
          }
          return (
            <div
              key={row.id}
              role="row"
              aria-rowindex={item.index + 2}
              className={cx('ctable__row', row.id === selectedId && 'ctable__row--selected')}
              style={style}
              onClick={() => navigate(`/registry/${row.id}${search}`)}
            >
              {columns.map((column) => (
                <div key={column.id} role="cell" className="ctable__cell">
                  {column.render(row, search)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="ctable"
      role="table"
      aria-label="Картотека граждан"
      aria-rowcount={total + 1}
      style={{ '--cols': template, '--table-min': `${minWidth}px` } as CSSProperties}
    >
      <div className="ctable__inner">
        <div className="ctable__head" role="row">
          {columns.map((column) => (
            <div key={column.id} role="columnheader" aria-sort={ariaSort(column, filters)}>
              {column.sortKey ? (
                <button
                  type="button"
                  className="ctable__sort"
                  onClick={() => column.sortKey && onSort(column.sortKey)}
                >
                  {column.header}
                  <SortIcon
                    className={cx(
                      'ctable__sort-icon',
                      filters.sortBy === column.sortKey && 'ctable__sort-icon--active',
                    )}
                  />
                </button>
              ) : (
                column.header
              )}
            </div>
          ))}
        </div>
        {body}
      </div>
    </div>
  );
}

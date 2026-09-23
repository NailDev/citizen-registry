import { useCallback, useMemo } from 'react';
import { Link, Outlet, useMatch } from 'react-router-dom';
import type { SortKey } from '@/domain/citizen';
import { cx } from '@/shared/lib/cx';
import { PageHeader } from '@/shared/ui/PageHeader';
import { PlusIcon } from '@/shared/ui/icons';
import { CitizenTable } from './CitizenTable';
import { RegistryToolbar } from './RegistryToolbar';
import { FILTERS_RESET, toQuery, useRegistryFilters } from './filters';
import { useCitizensInfinite } from './queries';
import './registry.css';

export function RegistryPage() {
  const match = useMatch('/registry/:id');
  const { filters, update } = useRegistryFilters();
  const query = useCitizensInfinite(useMemo(() => toQuery(filters), [filters]));

  const split = match !== null;
  const selectedId = match ? Number(match.params.id) : null;
  const firstPage = query.data?.pages[0];

  const handleSort = useCallback(
    (key: SortKey) => {
      if (filters.sortBy === key) {
        update({ sortDir: filters.sortDir === 'asc' ? 'desc' : 'asc' });
      } else {
        update({ sortBy: key, sortDir: 'asc' });
      }
    },
    [filters.sortBy, filters.sortDir, update],
  );

  const handleReset = useCallback(() => update(FILTERS_RESET), [update]);

  return (
    <>
      <PageHeader
        title="Картотека граждан"
        description="Найдите человека по ФИО, номеру или телефону, отфильтруйте список и откройте карточку."
        actions={
          <Link to="/registry/new" className="btn btn--primary">
            <PlusIcon />
            Новая карточка
          </Link>
        }
      />
      <div className={cx('registry', split && 'registry--split')}>
        <section className="registry__list panel" aria-label="Список граждан">
          <RegistryToolbar
            filters={filters}
            onChange={update}
            total={firstPage?.total}
            totalAll={firstPage?.totalAll}
            isFetching={query.isFetching && !query.isFetchingNextPage}
          />
          <CitizenTable
            query={query}
            filters={filters}
            selectedId={selectedId}
            compact={split}
            onSort={handleSort}
            onResetFilters={handleReset}
          />
        </section>
        <Outlet />
        {!split && <p className="sr-only">Выберите человека в списке, чтобы открыть его карточку.</p>}
      </div>
    </>
  );
}

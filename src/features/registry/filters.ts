import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CATEGORY_OPTIONS,
  GENDER_OPTIONS,
  REGION_OPTIONS,
  STATUS_OPTIONS,
  type Category,
  type CitizenStatus,
  type Gender,
} from '@/domain/dictionaries';
import { SORT_KEYS, type CitizensFilter, type SortDir, type SortKey } from '@/domain/citizen';

export interface RegistryFilters {
  q: string;
  statuses: CitizenStatus[];
  category: Category | '';
  region: string;
  gender: Gender | '';
  ageFrom: string;
  ageTo: string;
  overdueOnly: boolean;
  sortBy: SortKey;
  sortDir: SortDir;
}

export const DEFAULT_FILTERS: RegistryFilters = {
  q: '',
  statuses: [],
  category: '',
  region: '',
  gender: '',
  ageFrom: '',
  ageTo: '',
  overdueOnly: false,
  sortBy: 'id',
  sortDir: 'asc',
};

/** Всё, что сбрасывает кнопка «Сбросить»: сортировка остаётся. */
export const FILTERS_RESET: Partial<RegistryFilters> = {
  q: '',
  statuses: [],
  category: '',
  region: '',
  gender: '',
  ageFrom: '',
  ageTo: '',
  overdueOnly: false,
};

const digitsOnly = (value: string | null): string => (value ?? '').replace(/\D/g, '').slice(0, 3);

function oneOf<T extends string>(options: readonly { value: T }[], value: string | null): T | '' {
  return options.find((option) => option.value === value)?.value ?? '';
}

export function parseFilters(params: URLSearchParams): RegistryFilters {
  const statuses = (params.get('status') ?? '')
    .split(',')
    .map((item) => oneOf(STATUS_OPTIONS, item))
    .filter((item): item is CitizenStatus => item !== '');

  return {
    q: params.get('q') ?? '',
    statuses,
    category: oneOf(CATEGORY_OPTIONS, params.get('category')),
    region: oneOf(REGION_OPTIONS, params.get('region')),
    gender: oneOf(GENDER_OPTIONS, params.get('gender')),
    ageFrom: digitsOnly(params.get('ageFrom')),
    ageTo: digitsOnly(params.get('ageTo')),
    overdueOnly: params.get('overdue') === '1',
    sortBy: SORT_KEYS.find((key) => key === params.get('sort')) ?? DEFAULT_FILTERS.sortBy,
    sortDir: params.get('dir') === 'desc' ? 'desc' : 'asc',
  };
}

/** В URL попадают только отличия от значений по умолчанию — ссылка на выборку остаётся короткой. */
export function serializeFilters(filters: RegistryFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.statuses.length) params.set('status', filters.statuses.join(','));
  if (filters.category) params.set('category', filters.category);
  if (filters.region) params.set('region', filters.region);
  if (filters.gender) params.set('gender', filters.gender);
  if (filters.ageFrom) params.set('ageFrom', filters.ageFrom);
  if (filters.ageTo) params.set('ageTo', filters.ageTo);
  if (filters.overdueOnly) params.set('overdue', '1');
  if (filters.sortBy !== DEFAULT_FILTERS.sortBy) params.set('sort', filters.sortBy);
  if (filters.sortDir !== DEFAULT_FILTERS.sortDir) params.set('dir', filters.sortDir);
  return params;
}

/** Количество активных фильтров без учёта строки поиска и сортировки. */
export function countActiveFilters(filters: RegistryFilters): number {
  return [
    filters.statuses.length > 0,
    filters.category !== '',
    filters.region !== '',
    filters.gender !== '',
    filters.ageFrom !== '' || filters.ageTo !== '',
    filters.overdueOnly,
  ].filter(Boolean).length;
}

export function toQuery(filters: RegistryFilters): CitizensFilter {
  return {
    q: filters.q || undefined,
    statuses: filters.statuses.length ? filters.statuses : undefined,
    categories: filters.category ? [filters.category] : undefined,
    regions: filters.region ? [filters.region] : undefined,
    gender: filters.gender || undefined,
    ageFrom: filters.ageFrom ? Number(filters.ageFrom) : undefined,
    ageTo: filters.ageTo ? Number(filters.ageTo) : undefined,
    overdueOnly: filters.overdueOnly || undefined,
    sortBy: filters.sortBy,
    sortDir: filters.sortDir,
  };
}

export function useRegistryFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  const update = useCallback(
    (patch: Partial<RegistryFilters>) => {
      setSearchParams((prev) => serializeFilters({ ...parseFilters(prev), ...patch }), {
        replace: true,
      });
    },
    [setSearchParams],
  );

  return { filters, update };
}

import type { CitizensFilter, SortDir, SortKey } from '@/domain/citizen';
import { addDays, shiftYears, toIsoDate } from '@/shared/lib/date';
import type { IndexRecord } from './generator';

const compareText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

const COMPARATORS: Record<SortKey, (a: IndexRecord, b: IndexRecord) => number> = {
  id: (a, b) => a.id - b.id,
  fullName: (a, b) => compareText(a.fullName, b.fullName),
  birthDate: (a, b) => compareText(a.birthDate, b.birthDate),
  region: (a, b) => compareText(a.region, b.region),
  category: (a, b) => compareText(a.category, b.category),
  status: (a, b) => compareText(a.status, b.status),
  appealsOpen: (a, b) => a.appealsOpen - b.appealsOpen,
  lastContactAt: (a, b) => compareText(a.lastContactAt, b.lastContactAt),
};

export function filterCitizens(
  records: readonly IndexRecord[],
  filter: CitizensFilter,
): IndexRecord[] {
  const query = filter.q?.trim().toLowerCase() ?? '';
  const statuses = filter.statuses?.length ? new Set(filter.statuses) : null;
  const categories = filter.categories?.length ? new Set(filter.categories) : null;
  const regions = filter.regions?.length ? new Set(filter.regions) : null;

  // Возраст сравниваем через даты рождения: строки ISO сравниваются без разбора Date в цикле по 100 000 записей.
  const today = new Date();
  const latestBirth =
    filter.ageFrom !== undefined ? toIsoDate(shiftYears(today, -filter.ageFrom)) : null;
  const earliestBirth =
    filter.ageTo !== undefined
      ? toIsoDate(addDays(shiftYears(today, -(filter.ageTo + 1)), 1))
      : null;

  return records.filter((record) => {
    if (statuses && !statuses.has(record.status)) return false;
    if (categories && !categories.has(record.category)) return false;
    if (regions && !regions.has(record.region)) return false;
    if (filter.gender && record.gender !== filter.gender) return false;
    if (latestBirth && record.birthDate > latestBirth) return false;
    if (earliestBirth && record.birthDate < earliestBirth) return false;
    if (filter.overdueOnly && record.appealsOverdue === 0) return false;
    if (query && !record.searchKey.includes(query)) return false;
    return true;
  });
}

/** Сортирует переданный массив на месте. При равенстве порядок задаёт номер карточки. */
export function sortCitizens(
  rows: IndexRecord[],
  sortBy: SortKey = 'id',
  sortDir: SortDir = 'asc',
): IndexRecord[] {
  const compare = COMPARATORS[sortBy];
  const sign = sortDir === 'asc' ? 1 : -1;
  return rows.sort((a, b) => sign * compare(a, b) || a.id - b.id);
}

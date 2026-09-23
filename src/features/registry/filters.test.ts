import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FILTERS,
  countActiveFilters,
  parseFilters,
  serializeFilters,
  toQuery,
  type RegistryFilters,
} from './filters';

describe('фильтры картотеки в URL', () => {
  it('без параметров возвращает значения по умолчанию', () => {
    expect(parseFilters(new URLSearchParams())).toEqual(DEFAULT_FILTERS);
  });

  it('восстанавливает фильтры после сериализации', () => {
    const filters: RegistryFilters = {
      ...DEFAULT_FILTERS,
      q: 'иван',
      statuses: ['active', 'pending'],
      category: 'pensioner',
      ageFrom: '60',
      overdueOnly: true,
      sortBy: 'fullName',
      sortDir: 'desc',
    };
    expect(parseFilters(serializeFilters(filters))).toEqual(filters);
  });

  it('не пишет в URL значения по умолчанию', () => {
    expect(serializeFilters(DEFAULT_FILTERS).toString()).toBe('');
  });

  it('игнорирует некорректные значения', () => {
    const parsed = parseFilters(new URLSearchParams('status=foo,active&sort=zzz&ageFrom=abc&gender=x'));
    expect(parsed.statuses).toEqual(['active']);
    expect(parsed.sortBy).toBe('id');
    expect(parsed.ageFrom).toBe('');
    expect(parsed.gender).toBe('');
  });

  it('считает активные фильтры без поиска и сортировки', () => {
    expect(countActiveFilters({ ...DEFAULT_FILTERS, q: 'x', sortBy: 'fullName' })).toBe(0);
    expect(countActiveFilters({ ...DEFAULT_FILTERS, region: 'Москва', ageTo: '40' })).toBe(2);
  });

  it('преобразует фильтры в запрос к API', () => {
    const query = toQuery({ ...DEFAULT_FILTERS, ageFrom: '18', category: 'veteran' });
    expect(query.ageFrom).toBe(18);
    expect(query.categories).toEqual(['veteran']);
    expect(query.statuses).toBeUndefined();
  });
});

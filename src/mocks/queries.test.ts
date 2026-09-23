import { describe, expect, it } from 'vitest';
import { calcAge } from '@/shared/lib/format';
import { buildDetail, buildIndex, buildRecord } from './generator';
import { filterCitizens, sortCitizens } from './queries';
import { validateSections } from '@/domain/validation';
import { FORM_SECTIONS } from '@/domain/schema';

const records = buildIndex(3000);

describe('генератор данных', () => {
  it('всегда создаёт одну и ту же запись для одного номера', () => {
    expect(buildRecord(42)).toEqual(buildRecord(42));
  });

  it('создаёт карточки, проходящие валидацию схемы', () => {
    for (const id of [1, 77, 1500, 2999]) {
      const detail = buildDetail(records[id - 1]!);
      expect(validateSections(FORM_SECTIONS, detail.values)).toEqual({});
    }
  });
});

describe('фильтрация и сортировка', () => {
  it('фильтрует по статусу', () => {
    const rows = filterCitizens(records, { statuses: ['blocked'] });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.status === 'blocked')).toBe(true);
  });

  it('фильтрует по возрасту', () => {
    const rows = filterCitizens(records, { ageFrom: 30, ageTo: 40 });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => calcAge(row.birthDate) >= 30 && calcAge(row.birthDate) <= 40)).toBe(true);
  });

  it('ищет по ФИО без учёта регистра и по номеру', () => {
    const target = records[10]!;
    expect(filterCitizens(records, { q: target.lastName.toUpperCase() }).map((r) => r.id)).toContain(target.id);
    expect(filterCitizens(records, { q: String(target.id) }).map((r) => r.id)).toContain(target.id);
  });

  it('оставляет только записи с просрочкой', () => {
    const rows = filterCitizens(records, { overdueOnly: true });
    expect(rows.every((row) => row.appealsOverdue > 0)).toBe(true);
  });

  it('сортирует по ФИО в обоих направлениях', () => {
    const asc = sortCitizens([...records], 'fullName', 'asc');
    const desc = sortCitizens([...records], 'fullName', 'desc');
    expect(asc[0]!.fullName <= asc[1]!.fullName).toBe(true);
    expect(desc[0]!.fullName >= desc[1]!.fullName).toBe(true);
  });
});

import {
  APPEAL_TOPICS,
  REGIONS,
  STATUS_OPTIONS,
} from '@/domain/dictionaries';
import type {
  CitizenDetail,
  CitizensPage,
  CitizensQuery,
  DashboardData,
  HistoryEvent,
} from '@/domain/citizen';
import { diffValues } from '@/domain/formValues';
import { FIELD_BY_NAME, type FormValues } from '@/domain/schema';
import { addDays, toIsoDate } from '@/shared/lib/date';
import { NotFoundError } from '@/shared/lib/errors';
import { buildDetail, buildIndex, toIndexRecord, type IndexRecord } from './generator';
import { filterCitizens, sortCitizens } from './queries';
import { createRng } from './random';

export const TOTAL_CITIZENS = 100_000;

/** Имитация сетевых задержек, мс. В тестах обнуляется. */
export const latency = { list: 220, detail: 280, write: 450, dashboard: 350 };

const CURRENT_USER = 'Вы (оператор)';
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

interface Store {
  index: IndexRecord[];
  details: Map<number, CitizenDetail>;
  /** Растёт при каждой записи и сбрасывает кэш выборки. */
  version: number;
}

let store: Store | null = null;
let cache: { key: string; version: number; rows: IndexRecord[] } | null = null;

function getStore(): Store {
  if (!store) store = { index: buildIndex(TOTAL_CITIZENS), details: new Map(), version: 0 };
  return store;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Запрос отменён', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Запрос отменён', 'AbortError'));
      },
      { once: true },
    );
  });
}

function getDetail(current: Store, id: number): CitizenDetail {
  const cached = current.details.get(id);
  if (cached) return cached;
  const record = current.index[id - 1];
  if (!record) throw new NotFoundError(`Карточка №${id} не найдена`);
  const detail = buildDetail(record);
  current.details.set(id, detail);
  return detail;
}

function makeEvent(id: number, action: string): HistoryEvent {
  return {
    id: `${id}-${Date.now()}`,
    at: new Date().toISOString(),
    author: CURRENT_USER,
    action,
  };
}

export async function fetchCitizens(
  query: CitizensQuery,
  signal?: AbortSignal,
): Promise<CitizensPage> {
  await delay(latency.list, signal);
  const current = getStore();
  const { offset, limit, ...filter } = query;
  const key = JSON.stringify(filter);

  if (!cache || cache.key !== key || cache.version !== current.version) {
    const rows = sortCitizens(filterCitizens(current.index, filter), filter.sortBy, filter.sortDir);
    cache = { key, version: current.version, rows };
  }

  const end = offset + limit;
  return {
    items: cache.rows.slice(offset, end),
    total: cache.rows.length,
    totalAll: current.index.length,
    nextOffset: end < cache.rows.length ? end : null,
  };
}

export async function fetchCitizen(id: number, signal?: AbortSignal): Promise<CitizenDetail> {
  await delay(latency.detail, signal);
  return structuredClone(getDetail(getStore(), id));
}

export async function updateCitizen(id: number, values: FormValues): Promise<CitizenDetail> {
  await delay(latency.write);
  const current = getStore();
  const detail = getDetail(current, id);
  const changed = diffValues(detail.values, values)
    .map((name) => FIELD_BY_NAME.get(name)?.label ?? name)
    .slice(0, 3);
  const action = changed.length
    ? `Изменены поля: ${changed.join(', ')}`
    : 'Карточка сохранена без изменений';

  const next: CitizenDetail = {
    ...detail,
    values: { ...values },
    history: [makeEvent(id, action), ...detail.history],
  };
  current.details.set(id, next);
  current.index[id - 1] = toIndexRecord(id, values, current.index[id - 1]);
  current.version += 1;
  return structuredClone(next);
}

export async function createCitizen(values: FormValues): Promise<CitizenDetail> {
  await delay(latency.write);
  const current = getStore();
  const id = current.index.length + 1;
  const record = toIndexRecord(id, values);
  const detail: CitizenDetail = {
    id,
    values: { ...values },
    registeredAt: record.registeredAt,
    lastContactAt: record.lastContactAt,
    family: [],
    education: [],
    appeals: [],
    files: [],
    history: [makeEvent(id, 'Карточка создана')],
  };
  current.index.push(record);
  current.details.set(id, detail);
  current.version += 1;
  return structuredClone(detail);
}

const AGE_GROUPS = [
  { label: '18–24', from: 18, to: 24 },
  { label: '25–34', from: 25, to: 34 },
  { label: '35–44', from: 35, to: 44 },
  { label: '45–54', from: 45, to: 54 },
  { label: '55–64', from: 55, to: 64 },
  { label: '65–74', from: 65, to: 74 },
  { label: '75+', from: 75, to: 200 },
] as const;

/**
 * Итоги считаются по реальной картотеке. Помесячная динамика — синтетическая:
 * в настоящем API это был бы отдельный агрегирующий эндпоинт.
 */
export async function fetchDashboard(signal?: AbortSignal): Promise<DashboardData> {
  await delay(latency.dashboard, signal);
  const { index } = getStore();
  const today = new Date();
  const from30 = toIsoDate(addDays(today, -30));
  const from60 = toIsoDate(addDays(today, -60));
  const year = today.getFullYear();

  let newLast30 = 0;
  let newPrev30 = 0;
  let totalAppeals = 0;
  let openAppeals = 0;
  let overdueAppeals = 0;
  const statusCount = new Map<string, number>();
  const regionCount = new Map<string, number>();
  const ageCount = AGE_GROUPS.map(() => ({ male: 0, female: 0 }));

  for (const record of index) {
    if (record.registeredAt >= from30) newLast30 += 1;
    else if (record.registeredAt >= from60) newPrev30 += 1;
    totalAppeals += record.appealsTotal;
    openAppeals += record.appealsOpen;
    overdueAppeals += record.appealsOverdue;
    statusCount.set(record.status, (statusCount.get(record.status) ?? 0) + 1);
    regionCount.set(record.region, (regionCount.get(record.region) ?? 0) + 1);

    const age = year - Number(record.birthDate.slice(0, 4));
    const groupIndex = AGE_GROUPS.findIndex((group) => age >= group.from && age <= group.to);
    const bucket = ageCount[groupIndex];
    if (bucket) bucket[record.gender] += 1;
  }

  const rng = createRng(20260919);
  const monthlyBase = totalAppeals / 30;
  const appealsByMonth = Array.from({ length: 12 }, (_, offset) => {
    const monthIndex = (today.getMonth() - 11 + offset + 12) % 12;
    const created = Math.round(monthlyBase * (0.85 + rng() * 0.3 + offset * 0.012));
    return {
      month: MONTHS[monthIndex] ?? '',
      created,
      resolved: Math.round(created * (0.88 + rng() * 0.1)),
    };
  });

  const topicWeight = APPEAL_TOPICS.reduce((sum, topic) => sum + topic.weight, 0);

  return {
    totals: {
      citizens: index.length,
      newLast30,
      newPrev30,
      totalAppeals,
      openAppeals,
      overdueAppeals,
      avgResponseDays: 6.4,
      avgResponsePrevDays: 7.2,
    },
    byStatus: STATUS_OPTIONS.map((option) => ({
      status: option.value,
      label: option.label,
      value: statusCount.get(option.value) ?? 0,
    })),
    appealsByMonth,
    openByStatus: [
      { key: 'new', label: 'Новые', value: Math.round(openAppeals * 0.3) },
      { key: 'in_progress', label: 'В работе', value: Math.round(openAppeals * 0.45) },
      {
        key: 'waiting',
        label: 'Ожидают ответа',
        value: openAppeals - Math.round(openAppeals * 0.3) - Math.round(openAppeals * 0.45),
      },
    ],
    citizensByRegion: REGIONS.map((region) => ({
      region: region.name,
      value: regionCount.get(region.name) ?? 0,
    }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
    ageGroups: AGE_GROUPS.map((group, position) => ({
      group: group.label,
      male: ageCount[position]?.male ?? 0,
      female: ageCount[position]?.female ?? 0,
    })),
    appealTopics: APPEAL_TOPICS.map((topic) => ({
      topic: topic.name,
      value: Math.round((totalAppeals * topic.weight) / topicWeight),
    })),
    attention: index
      .filter((record) => record.appealsOverdue > 0)
      .sort((a, b) => b.appealsOverdue - a.appealsOverdue || b.appealsOpen - a.appealsOpen || a.id - b.id)
      .slice(0, 6),
  };
}

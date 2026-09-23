import type {
  AppealStatus,
  Category,
  CitizenStatus,
  Gender,
} from './dictionaries';
import type { FormValues } from './schema';

export type SortKey =
  | 'id'
  | 'fullName'
  | 'birthDate'
  | 'region'
  | 'category'
  | 'status'
  | 'appealsOpen'
  | 'lastContactAt';
export type SortDir = 'asc' | 'desc';

export const SORT_KEYS: readonly SortKey[] = [
  'id',
  'fullName',
  'birthDate',
  'region',
  'category',
  'status',
  'appealsOpen',
  'lastContactAt',
];

/** Облегчённая проекция для списка: остальные ~70 полей грузятся только при открытии карточки. */
export interface CitizenListItem {
  id: number;
  lastName: string;
  firstName: string;
  middleName: string;
  fullName: string;
  birthDate: string;
  gender: Gender;
  region: string;
  city: string;
  status: CitizenStatus;
  category: Category;
  phone: string;
  registeredAt: string;
  lastContactAt: string;
  appealsTotal: number;
  appealsOpen: number;
  appealsOverdue: number;
}

export interface CitizensFilter {
  q?: string;
  statuses?: readonly CitizenStatus[];
  categories?: readonly Category[];
  regions?: readonly string[];
  gender?: Gender;
  ageFrom?: number;
  ageTo?: number;
  overdueOnly?: boolean;
  sortBy?: SortKey;
  sortDir?: SortDir;
}

export interface CitizensQuery extends CitizensFilter {
  offset: number;
  limit: number;
}

export interface CitizensPage {
  items: CitizenListItem[];
  /** Количество записей, подходящих под фильтры. */
  total: number;
  /** Количество записей в картотеке без учёта фильтров. */
  totalAll: number;
  nextOffset: number | null;
}

export interface FamilyMember {
  id: string;
  relation: string;
  fullName: string;
  birthDate: string;
  dependent: boolean;
  phone: string;
}

export interface EducationRecord {
  id: string;
  level: string;
  institution: string;
  specialty: string;
  yearStart: number;
  yearEnd: number;
  documentNumber: string;
}

export interface Appeal {
  id: string;
  topic: string;
  channel: string;
  createdAt: string;
  deadline: string;
  status: AppealStatus;
  executor: string;
}

export interface CitizenFile {
  id: string;
  name: string;
  type: string;
  sizeKb: number;
  uploadedAt: string;
}

export interface HistoryEvent {
  id: string;
  at: string;
  author: string;
  action: string;
}

export interface CitizenDetail {
  id: number;
  values: FormValues;
  registeredAt: string;
  lastContactAt: string;
  family: FamilyMember[];
  education: EducationRecord[];
  appeals: Appeal[];
  files: CitizenFile[];
  history: HistoryEvent[];
}

export interface DashboardData {
  totals: {
    citizens: number;
    newLast30: number;
    newPrev30: number;
    totalAppeals: number;
    openAppeals: number;
    overdueAppeals: number;
    avgResponseDays: number;
    avgResponsePrevDays: number;
  };
  byStatus: Array<{ status: CitizenStatus; label: string; value: number }>;
  appealsByMonth: Array<{ month: string; created: number; resolved: number }>;
  openByStatus: Array<{ key: string; label: string; value: number }>;
  citizensByRegion: Array<{ region: string; value: number }>;
  ageGroups: Array<{ group: string; male: number; female: number }>;
  appealTopics: Array<{ topic: string; value: number }>;
  attention: CitizenListItem[];
}

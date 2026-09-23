import {
  APPEAL_CHANNELS,
  APPEAL_TOPICS,
  BENEFIT_OPTIONS,
  CATEGORY_OPTIONS,
  CITIZENSHIP_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  CONTACT_TIME_OPTIONS,
  CONTAINER_OPTIONS,
  STATUS_OPTIONS,
  DISABILITY_OPTIONS,
  DRIVER_CATEGORY_OPTIONS,
  ECO_INITIATIVE_OPTIONS,
  EDUCATION_OPTIONS,
  HOUSING_OPTIONS,
  INCOME_SOURCE_OPTIONS,
  MILITARY_OPTIONS,
  OPERATOR_OPTIONS,
  OWNERSHIP_OPTIONS,
  REGIONS,
  SEPARATION_OPTIONS,
  optionLabel,
  type AppealStatus,
  type Category,
  type CitizenStatus,
  type Gender,
  type Option,
} from '@/domain/dictionaries';
import type {
  Appeal,
  CitizenDetail,
  CitizenFile,
  CitizenListItem,
  EducationRecord,
  FamilyMember,
  HistoryEvent,
} from '@/domain/citizen';
import { buildInitialValues, type FormValues } from '@/domain/schema';
import { addDays, toIsoDate } from '@/shared/lib/date';
import { calcAge } from '@/shared/lib/format';
import { chance, createRng, digits, int, pick, weighted, type Rng } from './random';

export interface IndexRecord extends CitizenListItem {
  /** Заранее собранная строка для полнотекстового поиска по имени, номеру и телефону. */
  searchKey: string;
}

const MALE_FIRST = ['Александр', 'Сергей', 'Владимир', 'Андрей', 'Алексей', 'Дмитрий', 'Михаил', 'Иван', 'Николай', 'Евгений', 'Павел', 'Максим', 'Артём', 'Игорь', 'Олег', 'Виктор', 'Юрий', 'Роман', 'Денис', 'Кирилл', 'Ринат', 'Тимур'];
const FEMALE_FIRST = ['Елена', 'Ольга', 'Наталья', 'Татьяна', 'Ирина', 'Светлана', 'Анна', 'Мария', 'Екатерина', 'Людмила', 'Галина', 'Юлия', 'Марина', 'Надежда', 'Вера', 'Алина', 'Дарья', 'Оксана', 'Лариса', 'Валентина', 'Гульнара', 'Ляйсан'];
const FATHERS = [
  { male: 'Александрович', female: 'Александровна' },
  { male: 'Сергеевич', female: 'Сергеевна' },
  { male: 'Владимирович', female: 'Владимировна' },
  { male: 'Андреевич', female: 'Андреевна' },
  { male: 'Алексеевич', female: 'Алексеевна' },
  { male: 'Дмитриевич', female: 'Дмитриевна' },
  { male: 'Михайлович', female: 'Михайловна' },
  { male: 'Иванович', female: 'Ивановна' },
  { male: 'Николаевич', female: 'Николаевна' },
  { male: 'Евгеньевич', female: 'Евгеньевна' },
  { male: 'Павлович', female: 'Павловна' },
  { male: 'Игоревич', female: 'Игоревна' },
  { male: 'Олегович', female: 'Олеговна' },
  { male: 'Викторович', female: 'Викторовна' },
  { male: 'Юрьевич', female: 'Юрьевна' },
  { male: 'Ринатович', female: 'Ринатовна' },
] as const;
const SURNAMES = ['Иванов', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев', 'Петров', 'Соколов', 'Михайлов', 'Новиков', 'Фёдоров', 'Морозов', 'Волков', 'Алексеев', 'Лебедев', 'Семёнов', 'Егоров', 'Павлов', 'Козлов', 'Степанов', 'Николаев', 'Орлов', 'Андреев', 'Макаров', 'Никитин', 'Захаров', 'Зайцев', 'Соловьёв', 'Борисов', 'Яковлев', 'Григорьев', 'Романов', 'Воробьёв', 'Сергеев', 'Кузьмин', 'Фролов', 'Александров', 'Дмитриев', 'Королёв', 'Гусев', 'Киселёв', 'Ильин', 'Максимов', 'Поляков', 'Сорокин', 'Виноградов', 'Ковалёв', 'Белов', 'Медведев', 'Антонов', 'Тарасов', 'Хабибуллин', 'Гарипов'];
const STREETS = ['Ленина', 'Советская', 'Мира', 'Гагарина', 'Садовая', 'Центральная', 'Школьная', 'Пушкина', 'Молодёжная', 'Лесная', 'Набережная', 'Кирова', 'Заводская', 'Октябрьская', 'Победы'];
const EMPLOYERS = ['ООО «Ромашка»', 'АО «Волгоэнерго»', 'МУП «Горводоканал»', 'ГБУЗ «Городская больница №2»', 'МБОУ «Школа №14»', 'ООО «Стройинвест»', 'АО «Почта России»', 'ГУП «Экотранс»', 'ООО «Логистик Плюс»'];
const POSITIONS = ['Инженер', 'Бухгалтер', 'Водитель', 'Учитель', 'Продавец-консультант', 'Медсестра', 'Слесарь', 'Менеджер', 'Электрик', 'Администратор', 'Повар'];
const INSTITUTIONS = ['Нижегородский государственный университет', 'МГТУ им. Баумана', 'Казанский федеральный университет', 'Санкт-Петербургский политехнический университет', 'Технический колледж №7', 'Кубанский государственный университет', 'Уральский федеральный университет', 'Профессиональное училище №31'];
const SPECIALTIES = ['Экономика', 'Юриспруденция', 'Информационные системы', 'Строительство', 'Педагогика', 'Лечебное дело', 'Электроэнергетика', 'Менеджмент', 'Экология', 'Землеустройство'];
const EXECUTORS = ['Иванова Е. С.', 'Петров А. Н.', 'Кузнецова М. В.', 'Смирнов Д. О.', 'Орлова Т. П.'];
const FILE_TYPES = ['Скан паспорта', 'Заявление', 'Справка о составе семьи', 'Согласие на обработку ПДн', 'Договор с оператором', 'Выписка из ЕГРН'];

const TODAY = new Date();
const REGION_WEIGHTS = REGIONS.map((item) => [item, item.weight] as const);
const dayCache: string[] = [];
/** Кэш по числу дней назад: при генерации 100 000 записей одни и те же даты встречаются тысячи раз. */
const daysAgo = (days: number): string => {
  const cached = dayCache[days];
  if (cached !== undefined) return cached;
  const iso = toIsoDate(addDays(TODAY, -days));
  dayCache[days] = iso;
  return iso;
};
const pickValue = (rng: Rng, options: readonly Option[]): string => pick(rng, options).value;
const pickMany = (rng: Rng, options: readonly Option[], max: number): string[] =>
  options.filter(() => chance(rng, 0.35)).slice(0, max).map((option) => option.value);

function buildRecord(id: number): IndexRecord {
  const rng = createRng(id * 7919 + 13);
  const gender: Gender = chance(rng, 0.53) ? 'female' : 'male';
  const firstName = pick(rng, gender === 'female' ? FEMALE_FIRST : MALE_FIRST);
  const surname = pick(rng, SURNAMES);
  const lastName = gender === 'female' ? `${surname}а` : surname;
  const middleName = pick(rng, FATHERS)[gender];
  const age = 18 + Math.floor(((rng() + rng() + rng()) / 3) * 78);
  const birthDate = daysAgo(Math.floor(age * 365.25) + int(rng, 0, 364));

  const region = weighted(rng, REGION_WEIGHTS);
  const city = pick(rng, region.cities);
  const category: Category =
    age >= 60 && chance(rng, 0.75)
      ? 'pensioner'
      : weighted<Category>(rng, [['general', 60], ['low_income', 12], ['large_family', 10], ['disabled', 8], ['veteran', 5], ['pensioner', 5]]);
  const status = weighted<CitizenStatus>(rng, [['active', 78], ['pending', 10], ['archived', 9], ['blocked', 3]]);

  const sinceRegistered = int(rng, 0, 1400);
  const appealsTotal = weighted(rng, [[0, 30], [1, 25], [2, 18], [3, 12], [4, 8], [5, 4], [6, 3]]);
  const appealsOpen = Math.min(appealsTotal, weighted(rng, [[0, 55], [1, 30], [2, 10], [3, 5]]));
  const appealsOverdue = appealsOpen > 0 && chance(rng, 0.3) ? int(rng, 1, appealsOpen) : 0;
  const phone = `+7 (9${digits(rng, 2)}) ${digits(rng, 3)}-${digits(rng, 2)}-${digits(rng, 2)}`;
  const fullName = `${lastName} ${firstName} ${middleName}`;

  return {
    id,
    lastName,
    firstName,
    middleName,
    fullName,
    birthDate,
    gender,
    region: region.name,
    city,
    status,
    category,
    phone,
    registeredAt: daysAgo(sinceRegistered),
    lastContactAt: daysAgo(int(rng, 0, sinceRegistered)),
    appealsTotal,
    appealsOpen,
    appealsOverdue,
    searchKey: `${fullName} ${id} ${phone.replace(/\D/g, '')}`.toLowerCase(),
  };
}

export function buildIndex(count: number): IndexRecord[] {
  return Array.from({ length: count }, (_, index) => buildRecord(index + 1));
}

export { buildRecord };

function toStatus(value: string): CitizenStatus {
  return STATUS_OPTIONS.find((option) => option.value === value)?.value ?? 'pending';
}

function toCategory(value: string): Category {
  return CATEGORY_OPTIONS.find((option) => option.value === value)?.value ?? 'general';
}

/** Собирает строку списка из значений формы — так список остаётся согласованным после правок. */
export function toIndexRecord(
  id: number,
  values: FormValues,
  previous?: CitizenListItem,
): IndexRecord {
  const text = (name: string): string => {
    const value = values[name];
    return typeof value === 'string' ? value : '';
  };
  const lastName = text('lastName');
  const firstName = text('firstName');
  const middleName = text('middleName');
  const fullName = [lastName, firstName, middleName].filter(Boolean).join(' ');
  const phone = text('phone');
  const today = toIsoDate(TODAY);

  return {
    id,
    lastName,
    firstName,
    middleName,
    fullName,
    birthDate: text('birthDate'),
    gender: text('gender') === 'female' ? 'female' : 'male',
    region: text('regRegion'),
    city: text('regCity'),
    status: toStatus(text('status')),
    category: toCategory(text('category')),
    phone,
    registeredAt: previous?.registeredAt ?? today,
    lastContactAt: today,
    appealsTotal: previous?.appealsTotal ?? 0,
    appealsOpen: previous?.appealsOpen ?? 0,
    appealsOverdue: previous?.appealsOverdue ?? 0,
    searchKey: `${fullName} ${id} ${phone.replace(/\D/g, '')}`.toLowerCase(),
  };
}

function buildFamily(rng: Rng, record: CitizenListItem, values: FormValues, age: number): FamilyMember[] {
  const members: FamilyMember[] = [];
  const isFemale = record.gender === 'female';
  const push = (relation: string, fullName: string, birthDate: string, dependent: boolean): void => {
    members.push({
      id: `${record.id}-f${members.length + 1}`,
      relation,
      fullName,
      birthDate,
      dependent,
      phone: chance(rng, 0.7) ? `+7 (9${digits(rng, 2)}) ${digits(rng, 3)}-${digits(rng, 2)}-${digits(rng, 2)}` : '',
    });
  };

  if (values.maritalStatus === 'married') {
    const spouseFirst = pick(rng, isFemale ? MALE_FIRST : FEMALE_FIRST);
    const spouseLast = isFemale ? record.lastName.replace(/а$/, '') : `${record.lastName}а`;
    const spouseMiddle = pick(rng, FATHERS)[isFemale ? 'male' : 'female'];
    push(isFemale ? 'Муж' : 'Жена', `${spouseLast} ${spouseFirst} ${spouseMiddle}`, daysAgo(Math.floor((age + int(rng, -6, 6)) * 365.25)), false);
  }

  const children = age >= 22 ? weighted(rng, [[0, 35], [1, 30], [2, 25], [3, 7], [4, 3]]) : 0;
  for (let i = 0; i < children; i += 1) {
    const childAge = int(rng, 0, Math.min(35, age - 20));
    const daughter = chance(rng, 0.5);
    const first = pick(rng, daughter ? FEMALE_FIRST : MALE_FIRST);
    const surname = daughter && !isFemale ? `${record.lastName}а` : record.lastName;
    const middle = pick(rng, FATHERS)[daughter ? 'female' : 'male'];
    push(daughter ? 'Дочь' : 'Сын', `${surname} ${first} ${middle}`, daysAgo(Math.floor(childAge * 365.25) + int(rng, 0, 300)), childAge < 18);
  }

  if (age < 55 && chance(rng, 0.8)) {
    const last = pick(rng, SURNAMES);
    push('Мать', `${last}а ${pick(rng, FEMALE_FIRST)} ${pick(rng, FATHERS).female}`, daysAgo(Math.floor((age + int(rng, 20, 32)) * 365.25)), false);
  }
  return members;
}

function buildEducation(rng: Rng, record: CitizenListItem, age: number): { rows: EducationRecord[]; level: string } {
  const birthYear = TODAY.getFullYear() - age;
  const rows: EducationRecord[] = [];
  const add = (level: string, institution: string, specialty: string, start: number, years: number): void => {
    rows.push({
      id: `${record.id}-e${rows.length + 1}`,
      level: optionLabel(EDUCATION_OPTIONS, level),
      institution,
      specialty,
      yearStart: start,
      yearEnd: start + years,
      documentNumber: `${pick(rng, ['А', 'Б', 'В', 'Г'])}${digits(rng, 7)}`,
    });
  };

  add('secondary', `Средняя школа №${int(rng, 1, 90)}`, 'Общее образование', birthYear + 7, 11);
  let level = 'secondary';
  const path = weighted(rng, [['school', 30], ['college', 30], ['bachelor', 20], ['master', 17], ['phd', 3]] as const);
  if (path !== 'school' && age >= 21) {
    if (path === 'college') {
      add('vocational', pick(rng, INSTITUTIONS), pick(rng, SPECIALTIES), birthYear + 16, 3);
      level = 'vocational';
    } else {
      const institution = pick(rng, INSTITUTIONS);
      add('bachelor', institution, pick(rng, SPECIALTIES), birthYear + 18, 4);
      level = 'bachelor';
      if ((path === 'master' || path === 'phd') && age >= 24) {
        add('master', institution, pick(rng, SPECIALTIES), birthYear + 22, 2);
        level = 'master';
      }
      if (path === 'phd' && age >= 28) {
        add('phd', institution, pick(rng, SPECIALTIES), birthYear + 24, 3);
        level = 'phd';
      }
    }
  }
  return { rows, level };
}

function buildAppeals(rng: Rng, record: CitizenListItem): Appeal[] {
  const year = TODAY.getFullYear();
  return Array.from({ length: record.appealsTotal }, (_, index) => {
    const isOpen = index < record.appealsOpen;
    const isOverdue = index < record.appealsOverdue;
    const created = int(rng, isOpen ? 3 : 20, isOpen ? 60 : 500);
    const deadlineOffset = isOverdue ? -int(rng, 1, 20) : int(rng, 2, 25);
    const status: AppealStatus = isOpen
      ? weighted<AppealStatus>(rng, [['new', 3], ['in_progress', 5], ['waiting', 2]])
      : 'resolved';
    return {
      id: `ОБР-${year}-${String(record.id * 10 + index).padStart(7, '0')}`,
      topic: weighted(rng, APPEAL_TOPICS.map((topic) => [topic.name, topic.weight] as const)),
      channel: pick(rng, APPEAL_CHANNELS),
      createdAt: daysAgo(created),
      deadline: isOpen ? toIsoDate(addDays(TODAY, deadlineOffset)) : daysAgo(Math.max(0, created - 14)),
      status,
      executor: pick(rng, EXECUTORS),
    };
  });
}

function buildFiles(rng: Rng, record: CitizenListItem): CitizenFile[] {
  return Array.from({ length: int(rng, 2, 5) }, (_, index) => {
    const type = FILE_TYPES[index % FILE_TYPES.length] as string;
    return {
      id: `${record.id}-d${index + 1}`,
      name: `${type.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      type,
      sizeKb: int(rng, 80, 4200),
      uploadedAt: daysAgo(int(rng, 0, 400)),
    };
  });
}

function buildHistory(rng: Rng, record: CitizenListItem): HistoryEvent[] {
  const actions = [
    'Обновлены контактные данные',
    'Загружен документ',
    'Зарегистрировано обращение',
    'Изменена категория гражданина',
    'Проверены паспортные данные',
    'Обновлён адрес регистрации',
  ];
  const events: HistoryEvent[] = Array.from({ length: int(rng, 3, 6) }, (_, index) => ({
    id: `${record.id}-h${index + 1}`,
    at: `${daysAgo(int(rng, 1, 300))}T${String(int(rng, 8, 18)).padStart(2, '0')}:${String(int(rng, 0, 59)).padStart(2, '0')}:00`,
    author: pick(rng, EXECUTORS),
    action: pick(rng, actions),
  }));
  events.push({
    id: `${record.id}-h0`,
    at: `${record.registeredAt}T09:00:00`,
    author: pick(rng, EXECUTORS),
    action: 'Карточка создана',
  });
  return events.sort((a, b) => (a.at < b.at ? 1 : -1));
}

export function buildDetail(record: CitizenListItem): CitizenDetail {
  const rng = createRng(record.id * 104729 + 7);
  const age = calcAge(record.birthDate);
  const region = REGIONS.find((item) => item.name === record.region) ?? REGIONS[0];
  const born = pick(rng, region.cities);
  const sameAddress = chance(rng, 0.85);
  const factRegion = pick(rng, REGIONS);
  const maritalStatus = age < 22 ? 'single' : weighted(rng, [['married', 50], ['single', 22], ['divorced', 16], ['widowed', 12]] as const);

  const employmentStatus =
    record.category === 'pensioner'
      ? 'retired'
      : weighted(rng, [['employed', 60], ['self_employed', 8], ['unemployed', 10], ['student', 5], ['parental_leave', 7], ['retired', 10]] as const);
  const working = employmentStatus === 'employed' || employmentStatus === 'self_employed';
  const disabilityGroup = record.category === 'disabled' ? pickValue(rng, DISABILITY_OPTIONS.slice(1)) : 'none';
  const pensionType = record.category === 'pensioner' ? 'old_age' : disabilityGroup !== 'none' ? 'disability' : 'none';
  const hasDebt = chance(rng, 0.12);
  const hasForeign = chance(rng, 0.35);
  const subsidy = record.category === 'low_income' || chance(rng, 0.08);
  const dependentsCount = record.category === 'large_family' ? int(rng, 3, 5) : int(rng, 0, 2);

  const base: FormValues = {
    lastName: record.lastName,
    firstName: record.firstName,
    middleName: record.middleName,
    birthDate: record.birthDate,
    gender: record.gender,
    birthPlace: born,
    citizenship: chance(rng, 0.95) ? 'RU' : pickValue(rng, CITIZENSHIP_OPTIONS),
    maritalStatus,
    category: record.category,
    status: record.status,
    preferredLanguage: chance(rng, 0.92) ? 'ru' : 'tt',
    needsInterpreter: chance(rng, 0.03),

    passportSeries: digits(rng, 4),
    passportNumber: digits(rng, 6),
    passportDepartmentCode: `${digits(rng, 3)}-${digits(rng, 3)}`,
    passportIssuedBy: `ГУ МВД России по региону: ${record.region}`,
    passportIssueDate: daysAgo(int(rng, 200, Math.max(300, age * 300))),
    snils: `${digits(rng, 3)}-${digits(rng, 3)}-${digits(rng, 3)} ${digits(rng, 2)}`,
    inn: digits(rng, 12),
    militaryStatus: record.gender === 'male' ? pickValue(rng, MILITARY_OPTIONS) : 'not_liable',
    driverCategories: pickMany(rng, DRIVER_CATEGORY_OPTIONS, 3),
    hasForeignPassport: hasForeign,
    foreignPassportNumber: hasForeign ? digits(rng, 9) : '',
    foreignPassportUntil: hasForeign ? toIsoDate(addDays(TODAY, int(rng, -200, 2500))) : '',

    phone: record.phone,
    altPhone: chance(rng, 0.3) ? `+7 (9${digits(rng, 2)}) ${digits(rng, 3)}-${digits(rng, 2)}-${digits(rng, 2)}` : '',
    email: chance(rng, 0.75) ? `user${record.id}@example.com` : '',
    preferredContact: pickValue(rng, CONTACT_METHOD_OPTIONS),
    convenientTime: pickValue(rng, CONTACT_TIME_OPTIONS),
    notifyAppeals: chance(rng, 0.8),
    notifyNews: chance(rng, 0.3),
    consentPd: true,

    regRegion: record.region,
    regCity: record.city,
    regStreet: `ул. ${pick(rng, STREETS)}`,
    regHouse: String(int(rng, 1, 120)),
    regApartment: String(int(rng, 1, 250)),
    regPostalCode: String(int(rng, 100000, 692999)),
    sameAddress,
    factRegion: sameAddress ? '' : factRegion.name,
    factCity: sameAddress ? '' : pick(rng, factRegion.cities),
    factStreet: sameAddress ? '' : `ул. ${pick(rng, STREETS)}`,
    factHouse: sameAddress ? '' : String(int(rng, 1, 120)),
    factApartment: sameAddress ? '' : String(int(rng, 1, 250)),

    housingType: pickValue(rng, HOUSING_OPTIONS),
    ownership: pickValue(rng, OWNERSHIP_OPTIONS),
    livingArea: String(int(rng, 18, 140)),
    registeredResidents: String(int(rng, 1, 6)),
    dependents: String(dependentsCount),
    utilitiesDebt: hasDebt,
    utilitiesDebtAmount: hasDebt ? String(int(rng, 1500, 90000)) : '',

    employmentStatus,
    employer: working ? pick(rng, EMPLOYERS) : '',
    position: working ? pick(rng, POSITIONS) : '',
    profession: pick(rng, POSITIONS),
    experienceYears: String(Math.max(0, Math.min(age - 18, int(rng, 0, 45)))),
    monthlyIncome: String(int(rng, 12, 160) * 1000),
    incomeSources: [employmentStatus === 'retired' ? 'pension' : 'salary', ...pickMany(rng, INCOME_SOURCE_OPTIONS.slice(2), 1)],
    registeredAtEmploymentCenter: employmentStatus === 'unemployed' && chance(rng, 0.6),

    benefitTypes: record.category === 'general' ? [] : pickMany(rng, BENEFIT_OPTIONS, 3),
    disabilityGroup,
    disabilityUntil: disabilityGroup === 'none' ? '' : toIsoDate(addDays(TODAY, int(rng, 100, 1500))),
    pensionType,
    pensionStartDate: pensionType === 'none' ? '' : daysAgo(int(rng, 100, 5000)),
    socialCardNumber: chance(rng, 0.5) ? digits(rng, 10) : '',
    subsidyRequested: subsidy,
    subsidyAmount: subsidy ? String(int(rng, 8, 60) * 100) : '',
    benefitComment: chance(rng, 0.2) ? 'Проверить право на льготу при следующем обращении.' : '',

    tariffAccount: digits(rng, 10),
    regionalOperator: pickValue(rng, OPERATOR_OPTIONS),
    containerType: pickValue(rng, CONTAINER_OPTIONS),
    bulkWasteService: chance(rng, 0.25),
    wasteSeparation: pickValue(rng, SEPARATION_OPTIONS),
    ecoInitiatives: pickMany(rng, ECO_INITIATIVE_OPTIONS, 3),
  };

  const family = buildFamily(rng, record, base, age);
  const education = buildEducation(rng, record, age);
  const children = family.filter((member) => member.relation === 'Сын' || member.relation === 'Дочь').length;

  return {
    id: record.id,
    values: {
      ...buildInitialValues(base),
      childrenCount: String(children),
      educationLevel: education.level,
    },
    registeredAt: record.registeredAt,
    lastContactAt: record.lastContactAt,
    family,
    education: education.rows,
    appeals: buildAppeals(rng, record),
    files: buildFiles(rng, record),
    history: buildHistory(rng, record),
  };
}

import {
  BENEFIT_OPTIONS,
  CATEGORY_OPTIONS,
  CITIZENSHIP_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  CONTACT_TIME_OPTIONS,
  CONTAINER_OPTIONS,
  DISABILITY_OPTIONS,
  DRIVER_CATEGORY_OPTIONS,
  ECO_INITIATIVE_OPTIONS,
  EDUCATION_OPTIONS,
  EMPLOYMENT_OPTIONS,
  GENDER_OPTIONS,
  HOUSING_OPTIONS,
  INCOME_SOURCE_OPTIONS,
  LANGUAGE_OPTIONS,
  MARITAL_OPTIONS,
  MILITARY_OPTIONS,
  OPERATOR_OPTIONS,
  OWNERSHIP_OPTIONS,
  PENSION_OPTIONS,
  REGION_OPTIONS,
  SEPARATION_OPTIONS,
  STATUS_OPTIONS,
  type Option,
} from './dictionaries';

export type FieldValue = string | boolean | string[];
export type FormValues = Record<string, FieldValue>;

interface FieldBase {
  name: string;
  label: string;
  required?: boolean;
  requiredMessage?: string;
  hint?: string;
  /** Сколько колонок сетки занимает поле. */
  span?: 1 | 2 | 3;
  defaultValue?: FieldValue;
  /** Поле скрывается (и не валидируется), пока функция возвращает false. */
  visibleIf?: (values: FormValues) => boolean;
}

export interface InputField extends FieldBase {
  kind: 'text' | 'email' | 'tel' | 'date' | 'number' | 'textarea';
  placeholder?: string;
  pattern?: { regex: RegExp; message: string };
  min?: number;
  max?: number;
  step?: number;
  maxDate?: 'today';
  minDate?: string;
}

export interface ChoiceField extends FieldBase {
  kind: 'select' | 'radio' | 'multiselect';
  options: readonly Option[];
}

export interface ToggleField extends FieldBase {
  kind: 'checkbox' | 'switch';
}

export type FieldSchema = InputField | ChoiceField | ToggleField;

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: readonly FieldSchema[];
}

const NAME_PATTERN = {
  regex: /^[А-Яа-яЁёA-Za-z][А-Яа-яЁёA-Za-z\s'-]*$/,
  message: 'Только буквы, пробел и дефис',
};

const str = (values: FormValues, name: string): string => {
  const value = values[name];
  return typeof value === 'string' ? value : '';
};

const isTrue = (values: FormValues, name: string): boolean => values[name] === true;

const workingStatus = (values: FormValues): boolean =>
  ['employed', 'self_employed'].includes(str(values, 'employmentStatus'));

const hasValue = (values: FormValues, name: string): boolean => {
  const value = str(values, name);
  return value !== '' && value !== 'none';
};

export const FORM_SECTIONS: readonly FormSection[] = [
  {
    id: 'personal',
    title: 'Личные данные',
    description: 'Основные сведения, по которым гражданина находят в картотеке.',
    fields: [
      { name: 'lastName', label: 'Фамилия', kind: 'text', required: true, pattern: NAME_PATTERN },
      { name: 'firstName', label: 'Имя', kind: 'text', required: true, pattern: NAME_PATTERN },
      { name: 'middleName', label: 'Отчество', kind: 'text', pattern: NAME_PATTERN },
      { name: 'birthDate', label: 'Дата рождения', kind: 'date', required: true, maxDate: 'today', minDate: '1900-01-01' },
      { name: 'gender', label: 'Пол', kind: 'radio', required: true, options: GENDER_OPTIONS },
      { name: 'birthPlace', label: 'Место рождения', kind: 'text' },
      { name: 'citizenship', label: 'Гражданство', kind: 'select', required: true, options: CITIZENSHIP_OPTIONS, defaultValue: 'RU' },
      { name: 'maritalStatus', label: 'Семейное положение', kind: 'select', options: MARITAL_OPTIONS },
      { name: 'category', label: 'Категория гражданина', kind: 'select', required: true, options: CATEGORY_OPTIONS, defaultValue: 'general' },
      { name: 'status', label: 'Статус карточки', kind: 'select', required: true, options: STATUS_OPTIONS, defaultValue: 'pending' },
      { name: 'preferredLanguage', label: 'Язык общения', kind: 'select', options: LANGUAGE_OPTIONS, defaultValue: 'ru' },
      { name: 'needsInterpreter', label: 'Нужен переводчик', kind: 'switch' },
    ],
  },
  {
    id: 'documents',
    title: 'Документы',
    description: 'Паспортные данные и идентификаторы. Значения проверяются по формату.',
    fields: [
      { name: 'passportSeries', label: 'Серия паспорта', kind: 'text', pattern: { regex: /^\d{4}$/, message: 'Четыре цифры' }, placeholder: '0000' },
      { name: 'passportNumber', label: 'Номер паспорта', kind: 'text', pattern: { regex: /^\d{6}$/, message: 'Шесть цифр' }, placeholder: '000000' },
      { name: 'passportDepartmentCode', label: 'Код подразделения', kind: 'text', pattern: { regex: /^\d{3}-\d{3}$/, message: 'Формат 000-000' }, placeholder: '000-000' },
      { name: 'passportIssuedBy', label: 'Кем выдан', kind: 'text', span: 2 },
      { name: 'passportIssueDate', label: 'Дата выдачи', kind: 'date', maxDate: 'today' },
      { name: 'snils', label: 'СНИЛС', kind: 'text', pattern: { regex: /^\d{3}-\d{3}-\d{3} \d{2}$/, message: 'Формат 000-000-000 00' }, placeholder: '000-000-000 00' },
      { name: 'inn', label: 'ИНН', kind: 'text', pattern: { regex: /^\d{12}$/, message: '12 цифр' } },
      { name: 'militaryStatus', label: 'Воинский учёт', kind: 'select', options: MILITARY_OPTIONS },
      { name: 'driverCategories', label: 'Категории водительских прав', kind: 'multiselect', options: DRIVER_CATEGORY_OPTIONS, span: 3 },
      { name: 'hasForeignPassport', label: 'Есть загранпаспорт', kind: 'switch' },
      { name: 'foreignPassportNumber', label: 'Номер загранпаспорта', kind: 'text', pattern: { regex: /^\d{9}$/, message: 'Девять цифр' }, visibleIf: (v) => isTrue(v, 'hasForeignPassport') },
      { name: 'foreignPassportUntil', label: 'Действует до', kind: 'date', visibleIf: (v) => isTrue(v, 'hasForeignPassport') },
    ],
  },
  {
    id: 'contacts',
    title: 'Контакты',
    description: 'Как и когда с гражданином удобно связаться.',
    fields: [
      { name: 'phone', label: 'Телефон', kind: 'tel', required: true, pattern: { regex: /^\+?[\d\s()-]{10,18}$/, message: 'Введите номер телефона' }, placeholder: '+7 (900) 000-00-00' },
      { name: 'altPhone', label: 'Дополнительный телефон', kind: 'tel', pattern: { regex: /^\+?[\d\s()-]{10,18}$/, message: 'Введите номер телефона' } },
      { name: 'email', label: 'E-mail', kind: 'email', pattern: { regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Введите корректный e-mail' }, placeholder: 'name@example.com' },
      { name: 'preferredContact', label: 'Предпочтительный способ связи', kind: 'radio', options: CONTACT_METHOD_OPTIONS, span: 2, defaultValue: 'phone' },
      { name: 'convenientTime', label: 'Удобное время', kind: 'select', options: CONTACT_TIME_OPTIONS, defaultValue: 'any' },
      { name: 'notifyAppeals', label: 'Уведомлять о статусе обращений', kind: 'switch', defaultValue: true },
      { name: 'notifyNews', label: 'Получать новости оператора', kind: 'switch' },
      { name: 'consentPd', label: 'Согласие на обработку персональных данных получено', kind: 'checkbox', required: true, requiredMessage: 'Без согласия карточку сохранить нельзя', span: 2 },
    ],
  },
  {
    id: 'address',
    title: 'Адрес',
    fields: [
      { name: 'regRegion', label: 'Регион регистрации', kind: 'select', required: true, options: REGION_OPTIONS },
      { name: 'regCity', label: 'Населённый пункт', kind: 'text', required: true },
      { name: 'regStreet', label: 'Улица', kind: 'text' },
      { name: 'regHouse', label: 'Дом', kind: 'text' },
      { name: 'regApartment', label: 'Квартира', kind: 'text' },
      { name: 'regPostalCode', label: 'Индекс', kind: 'text', pattern: { regex: /^\d{6}$/, message: 'Шесть цифр' } },
      { name: 'sameAddress', label: 'Фактический адрес совпадает с адресом регистрации', kind: 'switch', span: 3, defaultValue: true },
      { name: 'factRegion', label: 'Фактический регион', kind: 'select', options: REGION_OPTIONS, visibleIf: (v) => !isTrue(v, 'sameAddress') },
      { name: 'factCity', label: 'Фактический населённый пункт', kind: 'text', required: true, visibleIf: (v) => !isTrue(v, 'sameAddress') },
      { name: 'factStreet', label: 'Улица', kind: 'text', visibleIf: (v) => !isTrue(v, 'sameAddress') },
      { name: 'factHouse', label: 'Дом', kind: 'text', visibleIf: (v) => !isTrue(v, 'sameAddress') },
      { name: 'factApartment', label: 'Квартира', kind: 'text', visibleIf: (v) => !isTrue(v, 'sameAddress') },
    ],
  },
  {
    id: 'household',
    title: 'Жильё и домохозяйство',
    fields: [
      { name: 'housingType', label: 'Тип жилья', kind: 'select', options: HOUSING_OPTIONS, span: 2 },
      { name: 'ownership', label: 'Право пользования', kind: 'select', options: OWNERSHIP_OPTIONS },
      { name: 'livingArea', label: 'Площадь, м²', kind: 'number', min: 1, max: 1000, step: 0.1 },
      { name: 'registeredResidents', label: 'Зарегистрировано человек', kind: 'number', min: 0, max: 30 },
      { name: 'childrenCount', label: 'Детей', kind: 'number', min: 0, max: 20 },
      { name: 'dependents', label: 'Иждивенцев', kind: 'number', min: 0, max: 20 },
      { name: 'utilitiesDebt', label: 'Есть задолженность по ЖКУ', kind: 'switch', span: 2 },
      { name: 'utilitiesDebtAmount', label: 'Сумма долга, ₽', kind: 'number', min: 0, visibleIf: (v) => isTrue(v, 'utilitiesDebt') },
    ],
  },
  {
    id: 'employment',
    title: 'Занятость и доход',
    fields: [
      { name: 'employmentStatus', label: 'Занятость', kind: 'select', options: EMPLOYMENT_OPTIONS, span: 2 },
      { name: 'educationLevel', label: 'Уровень образования', kind: 'select', options: EDUCATION_OPTIONS },
      { name: 'employer', label: 'Работодатель', kind: 'text', span: 2, visibleIf: workingStatus },
      { name: 'position', label: 'Должность', kind: 'text', visibleIf: workingStatus },
      { name: 'profession', label: 'Профессия', kind: 'text' },
      { name: 'experienceYears', label: 'Стаж, лет', kind: 'number', min: 0, max: 70 },
      { name: 'monthlyIncome', label: 'Доход в месяц, ₽', kind: 'number', min: 0 },
      { name: 'incomeSources', label: 'Источники дохода', kind: 'multiselect', options: INCOME_SOURCE_OPTIONS, span: 3 },
      { name: 'registeredAtEmploymentCenter', label: 'Состоит на учёте в центре занятости', kind: 'switch', span: 2, visibleIf: (v) => str(v, 'employmentStatus') === 'unemployed' },
    ],
  },
  {
    id: 'benefits',
    title: 'Льготы и выплаты',
    fields: [
      { name: 'benefitTypes', label: 'Действующие льготы', kind: 'multiselect', options: BENEFIT_OPTIONS, span: 3 },
      { name: 'disabilityGroup', label: 'Инвалидность', kind: 'select', options: DISABILITY_OPTIONS },
      { name: 'disabilityUntil', label: 'Установлена до', kind: 'date', visibleIf: (v) => hasValue(v, 'disabilityGroup') },
      { name: 'pensionType', label: 'Вид пенсии', kind: 'select', options: PENSION_OPTIONS },
      { name: 'pensionStartDate', label: 'Пенсия назначена с', kind: 'date', maxDate: 'today', visibleIf: (v) => hasValue(v, 'pensionType') },
      { name: 'socialCardNumber', label: 'Номер социальной карты', kind: 'text', pattern: { regex: /^\d{10}$/, message: 'Десять цифр' } },
      { name: 'subsidyRequested', label: 'Подана заявка на субсидию', kind: 'switch' },
      { name: 'subsidyAmount', label: 'Сумма субсидии, ₽', kind: 'number', min: 0, visibleIf: (v) => isTrue(v, 'subsidyRequested') },
      { name: 'benefitComment', label: 'Комментарий оператора', kind: 'textarea', span: 3 },
    ],
  },
  {
    id: 'waste',
    title: 'Обращение с отходами',
    description: 'Сведения для работы с региональным оператором по обращению с ТКО.',
    fields: [
      { name: 'tariffAccount', label: 'Лицевой счёт', kind: 'text', pattern: { regex: /^\d{10}$/, message: 'Десять цифр' } },
      { name: 'regionalOperator', label: 'Региональный оператор', kind: 'select', options: OPERATOR_OPTIONS, span: 2 },
      { name: 'containerType', label: 'Способ накопления отходов', kind: 'select', options: CONTAINER_OPTIONS, span: 2 },
      { name: 'bulkWasteService', label: 'Вывоз крупногабаритных отходов', kind: 'switch' },
      { name: 'wasteSeparation', label: 'Раздельный сбор', kind: 'radio', options: SEPARATION_OPTIONS, span: 3, defaultValue: 'none' },
      { name: 'ecoInitiatives', label: 'Участие в экоинициативах', kind: 'multiselect', options: ECO_INITIATIVE_OPTIONS, span: 3 },
    ],
  },
];

export const SECTION_BY_ID: ReadonlyMap<string, FormSection> = new Map(
  FORM_SECTIONS.map((section) => [section.id, section]),
);

export const FIELD_BY_NAME: ReadonlyMap<string, FieldSchema> = new Map(
  FORM_SECTIONS.flatMap((section) => section.fields.map((field) => [field.name, field] as const)),
);

export function getSections(ids: readonly string[]): FormSection[] {
  return ids.flatMap((id) => {
    const section = SECTION_BY_ID.get(id);
    return section ? [section] : [];
  });
}

export function emptyValueFor(field: FieldSchema): FieldValue {
  if (field.defaultValue !== undefined) return field.defaultValue;
  if (field.kind === 'checkbox' || field.kind === 'switch') return false;
  if (field.kind === 'multiselect') return [];
  return '';
}

export function buildInitialValues(overrides: FormValues = {}): FormValues {
  const values: FormValues = {};
  for (const section of FORM_SECTIONS) {
    for (const field of section.fields) {
      values[field.name] = emptyValueFor(field);
    }
  }
  return { ...values, ...overrides };
}

export function isFieldVisible(field: FieldSchema, values: FormValues): boolean {
  return field.visibleIf ? field.visibleIf(values) : true;
}

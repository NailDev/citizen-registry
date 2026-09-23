export interface Option<T extends string = string> {
  readonly value: T;
  readonly label: string;
}

const opts = (pairs: ReadonlyArray<readonly [string, string]>): readonly Option[] =>
  pairs.map(([value, label]) => ({ value, label }));

export function optionLabel(options: readonly Option[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Активна' },
  { value: 'pending', label: 'На проверке' },
  { value: 'archived', label: 'В архиве' },
  { value: 'blocked', label: 'Заблокирована' },
] as const satisfies readonly Option[];
export type CitizenStatus = (typeof STATUS_OPTIONS)[number]['value'];

export const CATEGORY_OPTIONS = [
  { value: 'general', label: 'Без категории' },
  { value: 'pensioner', label: 'Пенсионер' },
  { value: 'disabled', label: 'Лицо с инвалидностью' },
  { value: 'large_family', label: 'Многодетная семья' },
  { value: 'veteran', label: 'Ветеран' },
  { value: 'low_income', label: 'Малоимущий' },
] as const satisfies readonly Option[];
export type Category = (typeof CATEGORY_OPTIONS)[number]['value'];

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
] as const satisfies readonly Option[];
export type Gender = (typeof GENDER_OPTIONS)[number]['value'];

export const APPEAL_STATUS_OPTIONS = [
  { value: 'new', label: 'Новое' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'waiting', label: 'Ожидает ответа' },
  { value: 'resolved', label: 'Решено' },
] as const satisfies readonly Option[];
export type AppealStatus = (typeof APPEAL_STATUS_OPTIONS)[number]['value'];

export const APPEAL_TOPICS = [
  { name: 'Вывоз ТКО', weight: 30 },
  { name: 'Тариф и начисления', weight: 22 },
  { name: 'Контейнерные площадки', weight: 16 },
  { name: 'Раздельный сбор', weight: 12 },
  { name: 'Несанкционированные свалки', weight: 10 },
  { name: 'Экоуслуги и переработка', weight: 6 },
  { name: 'Прочее', weight: 4 },
] as const;

export const APPEAL_CHANNELS = ['Портал', 'Электронная почта', 'Телефон', 'Личный приём', 'РЭО Радар'] as const;


export const REGIONS = [
  { name: 'Москва', weight: 18, cities: ['Москва', 'Зеленоград'] },
  { name: 'Санкт-Петербург', weight: 12, cities: ['Санкт-Петербург', 'Пушкин', 'Колпино'] },
  { name: 'Краснодарский край', weight: 9, cities: ['Краснодар', 'Сочи', 'Новороссийск'] },
  { name: 'Республика Татарстан', weight: 8, cities: ['Казань', 'Набережные Челны', 'Альметьевск'] },
  { name: 'Свердловская область', weight: 8, cities: ['Екатеринбург', 'Нижний Тагил'] },
  { name: 'Нижегородская область', weight: 8, cities: ['Нижний Новгород', 'Дзержинск', 'Арзамас'] },
  { name: 'Новосибирская область', weight: 7, cities: ['Новосибирск', 'Бердск'] },
  { name: 'Самарская область', weight: 7, cities: ['Самара', 'Тольятти'] },
  { name: 'Ростовская область', weight: 7, cities: ['Ростов-на-Дону', 'Таганрог', 'Шахты'] },
  { name: 'Хабаровский край', weight: 4, cities: ['Хабаровск', 'Комсомольск-на-Амуре'] },
  { name: 'Новгородская область', weight: 3, cities: ['Великий Новгород', 'Боровичи'] },
  { name: 'Севастополь', weight: 3, cities: ['Севастополь'] },
] as const;

export const REGION_OPTIONS: readonly Option[] = REGIONS.map((region) => ({
  value: region.name,
  label: region.name,
}));

export const CITIZENSHIP_OPTIONS = opts([
  ['RU', 'Российская Федерация'],
  ['BY', 'Беларусь'],
  ['KZ', 'Казахстан'],
  ['AM', 'Армения'],
  ['UZ', 'Узбекистан'],
]);

export const MARITAL_OPTIONS = opts([
  ['single', 'Не состоит в браке'],
  ['married', 'Состоит в браке'],
  ['divorced', 'Разведён(а)'],
  ['widowed', 'Вдовец / вдова'],
]);

export const LANGUAGE_OPTIONS = opts([
  ['ru', 'Русский'],
  ['tt', 'Татарский'],
  ['ba', 'Башкирский'],
  ['ce', 'Чеченский'],
  ['en', 'Английский'],
]);

export const MILITARY_OPTIONS = opts([
  ['not_liable', 'Не подлежит учёту'],
  ['reserve', 'В запасе'],
  ['conscript', 'Призывник'],
  ['exempt', 'Освобождён от службы'],
]);

export const DRIVER_CATEGORY_OPTIONS = opts([
  ['A', 'A'],
  ['B', 'B'],
  ['C', 'C'],
  ['D', 'D'],
  ['E', 'E'],
]);

export const CONTACT_METHOD_OPTIONS = opts([
  ['phone', 'Звонок'],
  ['sms', 'SMS'],
  ['email', 'E-mail'],
  ['post', 'Почта'],
]);

export const CONTACT_TIME_OPTIONS = opts([
  ['any', 'В любое время'],
  ['morning', 'Утром (9–12)'],
  ['day', 'Днём (12–17)'],
  ['evening', 'Вечером (17–20)'],
]);

export const HOUSING_OPTIONS = opts([
  ['apartment', 'Квартира в многоквартирном доме'],
  ['house', 'Частный дом'],
  ['dorm', 'Общежитие'],
  ['rented', 'Съёмное жильё'],
  ['other', 'Другое'],
]);

export const OWNERSHIP_OPTIONS = opts([
  ['owner', 'Собственник'],
  ['tenant', 'Наниматель'],
  ['relative', 'Проживает у родственников'],
]);

export const EMPLOYMENT_OPTIONS = opts([
  ['employed', 'Работает по найму'],
  ['self_employed', 'Самозанятый / ИП'],
  ['unemployed', 'Не работает'],
  ['retired', 'На пенсии'],
  ['student', 'Учится'],
  ['parental_leave', 'В отпуске по уходу за ребёнком'],
]);

export const INCOME_SOURCE_OPTIONS = opts([
  ['salary', 'Заработная плата'],
  ['pension', 'Пенсия'],
  ['benefits', 'Пособия'],
  ['business', 'Собственное дело'],
  ['rent', 'Аренда'],
  ['alimony', 'Алименты'],
]);

export const EDUCATION_OPTIONS = opts([
  ['basic', 'Основное общее'],
  ['secondary', 'Среднее общее'],
  ['vocational', 'Среднее профессиональное'],
  ['bachelor', 'Бакалавриат'],
  ['master', 'Магистратура / специалитет'],
  ['phd', 'Аспирантура и выше'],
]);

export const BENEFIT_OPTIONS = opts([
  ['housing_subsidy', 'Субсидия на ЖКУ'],
  ['utilities_discount', 'Скидка на коммунальные услуги'],
  ['transport', 'Льготный проезд'],
  ['medicine', 'Льготные лекарства'],
  ['childcare', 'Детские пособия'],
  ['veteran_support', 'Меры поддержки ветеранов'],
]);

export const DISABILITY_OPTIONS = opts([
  ['none', 'Нет'],
  ['1', 'I группа'],
  ['2', 'II группа'],
  ['3', 'III группа'],
  ['child', 'Ребёнок-инвалид'],
]);

export const PENSION_OPTIONS = opts([
  ['none', 'Не получает'],
  ['old_age', 'По старости'],
  ['disability', 'По инвалидности'],
  ['survivor', 'По потере кормильца'],
  ['service', 'За выслугу лет'],
]);

export const OPERATOR_OPTIONS = opts([
  ['eco_north', 'Региональный оператор «ЭкоСевер»'],
  ['eco_volga', 'Региональный оператор «ЭкоВолга»'],
  ['clean_city', 'Региональный оператор «Чистый город»'],
  ['green_ring', 'Региональный оператор «Зелёное кольцо»'],
]);

export const CONTAINER_OPTIONS = opts([
  ['common', 'Общий контейнер во дворе'],
  ['separate', 'Раздельные контейнеры'],
  ['bunker', 'Бункер / контейнерная площадка'],
  ['individual', 'Индивидуальный мешок или бак'],
]);

export const SEPARATION_OPTIONS = opts([
  ['none', 'Не ведётся'],
  ['partial', 'Частично'],
  ['full', 'Полностью'],
]);

export const ECO_INITIATIVE_OPTIONS = opts([
  ['sorting', 'Раздельный сбор'],
  ['batteries', 'Сбор батареек'],
  ['glass', 'Сдача стекла'],
  ['eco_events', 'Экологические акции'],
]);

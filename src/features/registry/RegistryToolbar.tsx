import { useEffect, useRef, useState } from 'react';
import {
  CATEGORY_OPTIONS,
  GENDER_OPTIONS,
  REGION_OPTIONS,
  STATUS_OPTIONS,
  type CitizenStatus,
} from '@/domain/dictionaries';
import { Button } from '@/shared/ui/Button';
import { FilterIcon, SearchIcon } from '@/shared/ui/icons';
import { formatNumber } from '@/shared/lib/format';
import { countActiveFilters, FILTERS_RESET, type RegistryFilters } from './filters';

const SEARCH_DEBOUNCE_MS = 300;

interface RegistryToolbarProps {
  filters: RegistryFilters;
  onChange: (patch: Partial<RegistryFilters>) => void;
  total: number | undefined;
  totalAll: number | undefined;
  isFetching: boolean;
}

export function RegistryToolbar({
  filters,
  onChange,
  total,
  totalAll,
  isFetching,
}: RegistryToolbarProps) {
  const [text, setText] = useState(filters.q);
  const [expanded, setExpanded] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const activeCount = countActiveFilters(filters);

  // Внешние изменения q (например, переход по ссылке) подтягиваем в поле, пока пользователь не печатает.
  useEffect(() => {
    if (timer.current === undefined) setText(filters.q);
  }, [filters.q]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleSearch = (value: string): void => {
    setText(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      onChange({ q: value.trim() });
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleReset = (): void => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    setText('');
    onChange(FILTERS_RESET);
  };

  const toggleStatus = (status: CitizenStatus): void => {
    onChange({
      statuses: filters.statuses.includes(status)
        ? filters.statuses.filter((item) => item !== status)
        : [...filters.statuses, status],
    });
  };

  return (
    <div className="toolbar">
      <div className="toolbar__row">
        <div className="toolbar__search">
          <SearchIcon />
          <label htmlFor="registry-search" className="sr-only">
            Поиск по ФИО, номеру карточки или телефону
          </label>
          <input
            id="registry-search"
            className="input"
            type="search"
            placeholder="ФИО, номер или телефон"
            value={text}
            onChange={(event) => handleSearch(event.target.value)}
          />
        </div>
        <Button
          variant="secondary"
          aria-expanded={expanded}
          aria-controls="registry-filters"
          onClick={() => setExpanded((prev) => !prev)}
        >
          <FilterIcon />
          Фильтры{activeCount > 0 && ` · ${activeCount}`}
        </Button>
      </div>

      <p className="toolbar__count" aria-live="polite">
        {total === undefined || totalAll === undefined ? (
          'Считаем записи…'
        ) : (
          <>
            Найдено <strong>{formatNumber(total)}</strong> из {formatNumber(totalAll)}
          </>
        )}
        {isFetching && total !== undefined && <span className="toolbar__busy"> · обновляем…</span>}
      </p>

      {expanded && (
        <div id="registry-filters" className="filters">
          <fieldset className="field">
            <legend className="field__label">Статус карточки</legend>
            <div className="choice-group">
              {STATUS_OPTIONS.map((option) => (
                <label key={option.value} className="choice">
                  <input
                    type="checkbox"
                    checked={filters.statuses.includes(option.value)}
                    onChange={() => toggleStatus(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="field">
            <label htmlFor="filter-category" className="field__label">
              Категория
            </label>
            <select
              id="filter-category"
              className="select"
              value={filters.category}
              onChange={(event) => {
                const next = CATEGORY_OPTIONS.find((item) => item.value === event.target.value);
                onChange({ category: next?.value ?? '' });
              }}
            >
              <option value="">Все категории</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="filter-region" className="field__label">
              Регион
            </label>
            <select
              id="filter-region"
              className="select"
              value={filters.region}
              onChange={(event) => onChange({ region: event.target.value })}
            >
              <option value="">Все регионы</option>
              {REGION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="field">
            <legend className="field__label">Пол</legend>
            <div className="choice-group">
              <label className="choice">
                <input
                  type="radio"
                  name="filter-gender"
                  checked={filters.gender === ''}
                  onChange={() => onChange({ gender: '' })}
                />
                <span>Любой</span>
              </label>
              {GENDER_OPTIONS.map((option) => (
                <label key={option.value} className="choice">
                  <input
                    type="radio"
                    name="filter-gender"
                    checked={filters.gender === option.value}
                    onChange={() => onChange({ gender: option.value })}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="field">
            <legend className="field__label">Возраст, лет</legend>
            <div className="filters__age">
              <input
                className="input"
                type="text"
                inputMode="numeric"
                placeholder="от"
                aria-label="Возраст от"
                value={filters.ageFrom}
                onChange={(event) => onChange({ ageFrom: event.target.value.replace(/\D/g, '').slice(0, 3) })}
              />
              <input
                className="input"
                type="text"
                inputMode="numeric"
                placeholder="до"
                aria-label="Возраст до"
                value={filters.ageTo}
                onChange={(event) => onChange({ ageTo: event.target.value.replace(/\D/g, '').slice(0, 3) })}
              />
            </div>
          </fieldset>

          <div className="field">
            <label className="switch">
              <input
                type="checkbox"
                role="switch"
                checked={filters.overdueOnly}
                onChange={(event) => onChange({ overdueOnly: event.target.checked })}
              />
              <span className="switch__track" aria-hidden="true" />
              <span>Есть просроченные обращения</span>
            </label>
          </div>

          <div className="filters__actions">
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={activeCount === 0 && !text}>
              Сбросить фильтры
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

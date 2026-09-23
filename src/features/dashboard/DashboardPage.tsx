import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { DashboardData } from '@/domain/citizen';
import { cx } from '@/shared/lib/cx';
import { formatDecimal, formatNumber, plural } from '@/shared/lib/format';
import { CitizenStatusBadge } from '@/shared/ui/CitizenStatusBadge';
import { PageHeader } from '@/shared/ui/PageHeader';
import { ErrorState, LoadingState } from '@/shared/ui/States';
import { AgeBars, CHART_COLORS, OpenStatusDonut, RegionBars, TopicBars, TrendChart } from './Charts';
import { useDashboard } from './queries';
import './dashboard.css';

interface KpiProps {
  label: string;
  value: string;
  note: string;
  tone?: 'good' | 'bad' | 'neutral';
}

function Kpi({ label, value, note, tone = 'neutral' }: KpiProps) {
  return (
    <div className="kpi">
      <dt>{label}</dt>
      <dd>{value}</dd>
      <p className={cx('kpi__note', `kpi__note--${tone}`)}>{note}</p>
    </div>
  );
}

function ChartPanel({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cx('panel', 'chart-panel', className)}>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </section>
  );
}

function percentChange(current: number, previous: number): string {
  if (previous === 0) return '—';
  const change = Math.round(((current - previous) / previous) * 100);
  return `${change > 0 ? '+' : ''}${change} %`;
}

function KpiStrip({ totals }: { totals: DashboardData['totals'] }) {
  const newTrend = totals.newLast30 >= totals.newPrev30;
  const overdueShare = totals.openAppeals ? Math.round((totals.overdueAppeals / totals.openAppeals) * 100) : 0;
  const responseDelta = totals.avgResponseDays - totals.avgResponsePrevDays;
  return (
    <dl className="panel kpi-strip">
      <Kpi label="Граждан в картотеке" value={formatNumber(totals.citizens)} note="все статусы карточек" />
      <Kpi
        label="Новых карточек за 30 дней"
        value={formatNumber(totals.newLast30)}
        note={`${percentChange(totals.newLast30, totals.newPrev30)} к прошлым 30 дням`}
        tone={newTrend ? 'good' : 'bad'}
      />
      <Kpi
        label="Открытые обращения"
        value={formatNumber(totals.openAppeals)}
        note={`из ${formatNumber(totals.totalAppeals)} ${plural(totals.totalAppeals, ['обращения', 'обращений', 'обращений'])} всего`}
      />
      <Kpi
        label="Просрочено"
        value={formatNumber(totals.overdueAppeals)}
        note={`${overdueShare} % от открытых`}
        tone="bad"
      />
      <Kpi
        label="Средний срок ответа"
        value={`${formatDecimal(totals.avgResponseDays)} дн.`}
        note={`${responseDelta < 0 ? '−' : '+'}${formatDecimal(Math.abs(responseDelta))} дн. к прошлому месяцу`}
        tone={responseDelta <= 0 ? 'good' : 'bad'}
      />
    </dl>
  );
}

export function DashboardPage() {
  const { data, isPending, isError, error, refetch } = useDashboard();

  return (
    <>
      <PageHeader
        title="Обзор картотеки"
        description="Состояние карточек и обращений граждан на сегодня."
        actions={
          <Link to="/registry" className="btn btn--secondary">
            Открыть картотеку
          </Link>
        }
      />
      {isPending && <LoadingState label="Считаем показатели…" />}
      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}
      {data && (
        <div className="dashboard">
          <KpiStrip totals={data.totals} />

          <ChartPanel
            className="dashboard__trend"
            title="Обращения по месяцам"
            description="Сколько обращений поступило и сколько закрыто за последние 12 месяцев."
          >
            <TrendChart data={data.appealsByMonth} />
          </ChartPanel>

          <ChartPanel
            className="dashboard__donut"
            title="Открытые обращения"
            description="Распределение по статусам обработки."
          >
            <OpenStatusDonut data={data.openByStatus} />
          </ChartPanel>

          <ChartPanel title="Граждане по регионам" description="Восемь регионов с наибольшим числом карточек.">
            <RegionBars data={data.citizensByRegion} />
          </ChartPanel>

          <ChartPanel title="Возраст и пол" description="Количество граждан в возрастных группах.">
            <AgeBars data={data.ageGroups} />
          </ChartPanel>

          <ChartPanel title="О чём обращаются" description="Темы обращений за всё время.">
            <TopicBars data={data.appealTopics} />
          </ChartPanel>

          <section className="panel dashboard__attention">
            <h2>Требуют внимания</h2>
            <p>Граждане с наибольшим числом просроченных обращений.</p>
            <ul className="attention">
              {data.attention.map((citizen) => (
                <li key={citizen.id} className="attention__item">
                  <div>
                    <Link to={`/registry/${citizen.id}`} className="attention__name">
                      {citizen.fullName}
                    </Link>
                    <p className="attention__meta">
                      № {citizen.id} · {citizen.city}
                    </p>
                  </div>
                  <CitizenStatusBadge status={citizen.status} />
                  <p className="attention__overdue">
                    {citizen.appealsOverdue} проср. из {citizen.appealsOpen}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel dashboard__statuses">
            <h2>Статусы карточек</h2>
            <p>Доля каждого статуса в картотеке.</p>
            <div
              className="statusbar"
              role="img"
              aria-label={data.byStatus.map((item) => `${item.label}: ${formatNumber(item.value)}`).join(', ')}
            >
              {data.byStatus.map((item, index) => (
                <span
                  key={item.status}
                  style={{
                    flexGrow: item.value,
                    background: [CHART_COLORS.primary, CHART_COLORS.amber, CHART_COLORS.grey, CHART_COLORS.coral][index],
                  }}
                />
              ))}
            </div>
            <ul className="legend">
              {data.byStatus.map((item, index) => (
                <li key={item.status}>
                  <span
                    className="legend__dot"
                    style={{
                      background: [CHART_COLORS.primary, CHART_COLORS.amber, CHART_COLORS.grey, CHART_COLORS.coral][index],
                    }}
                  />
                  {item.label}
                  <strong>{formatNumber(item.value)}</strong>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}

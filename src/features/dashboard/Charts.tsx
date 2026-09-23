import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardData } from '@/domain/citizen';
import { formatNumber } from '@/shared/lib/format';

export const CHART_COLORS = {
  primary: '#0b6b57',
  blue: '#3b6fb6',
  amber: '#d9922b',
  coral: '#c9553d',
  grey: '#9bb0a7',
  grid: '#dbe3df',
  axis: '#62726c',
} as const;

const AXIS_TICK = { fontSize: 12, fill: CHART_COLORS.axis };
const formatTooltip = (value: unknown): string => formatNumber(Number(value));

export function TrendChart({ data }: { data: DashboardData['appealsByMonth'] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={AXIS_TICK} />
        <YAxis tickLine={false} axisLine={false} tick={AXIS_TICK} width={56} tickFormatter={formatTooltip} />
        <Tooltip formatter={formatTooltip} />
        <Legend iconType="circle" />
        <Area type="monotone" dataKey="created" name="Поступило" stroke={CHART_COLORS.primary} strokeWidth={2} fill={CHART_COLORS.primary} fillOpacity={0.14} />
        <Area type="monotone" dataKey="resolved" name="Решено" stroke={CHART_COLORS.blue} strokeWidth={2} fill={CHART_COLORS.blue} fillOpacity={0.08} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const DONUT_COLORS = [CHART_COLORS.blue, CHART_COLORS.amber, CHART_COLORS.grey];

export function OpenStatusDonut({ data }: { data: DashboardData['openByStatus'] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="label" innerRadius={62} outerRadius={94} paddingAngle={2}>
          {data.map((item, index) => (
            <Cell key={item.key} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={formatTooltip} />
        <Legend iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function RegionBars({ data }: { data: DashboardData['citizensByRegion'] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tick={AXIS_TICK} tickFormatter={formatTooltip} />
        <YAxis type="category" dataKey="region" width={150} tickLine={false} axisLine={false} tick={AXIS_TICK} />
        <Tooltip formatter={formatTooltip} cursor={{ fill: '#f5f8f6' }} />
        <Bar dataKey="value" name="Граждан" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AgeBars({ data }: { data: DashboardData['ageGroups'] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis dataKey="group" tickLine={false} axisLine={false} tick={AXIS_TICK} />
        <YAxis tickLine={false} axisLine={false} tick={AXIS_TICK} width={56} tickFormatter={formatTooltip} />
        <Tooltip formatter={formatTooltip} cursor={{ fill: '#f5f8f6' }} />
        <Legend iconType="circle" />
        <Bar dataKey="male" name="Мужчины" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
        <Bar dataKey="female" name="Женщины" fill={CHART_COLORS.coral} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopicBars({ data }: { data: DashboardData['appealTopics'] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tick={AXIS_TICK} tickFormatter={formatTooltip} />
        <YAxis type="category" dataKey="topic" width={170} tickLine={false} axisLine={false} tick={AXIS_TICK} />
        <Tooltip formatter={formatTooltip} cursor={{ fill: '#f5f8f6' }} />
        <Bar dataKey="value" name="Обращений" fill={CHART_COLORS.amber} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

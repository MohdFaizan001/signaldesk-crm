import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';

const CHART_COLORS = ['#4263D8', '#0D9488', '#D97706', '#7C3AED', '#16A34A', '#DC2626', '#6366F1'];

interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  bars: { key: string; color: string; name: string }[];
  height?: number;
}

export function SimpleBarChart({ data, xKey, bars, height = 280 }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#8896A6' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#8896A6' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
        />
        {bars.map((bar) => (
          <Bar key={bar.key} dataKey={bar.key} fill={bar.color} name={bar.name} radius={[4, 4, 0, 0]} barSize={28} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

interface AreaChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  areas: { key: string; color: string; name: string }[];
  height?: number;
}

export function SimpleAreaChart({ data, xKey, areas, height = 280 }: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          {areas.map((area) => (
            <linearGradient key={area.key} id={`gradient-${area.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={area.color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={area.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#8896A6' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#8896A6' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        {areas.map((area) => (
          <Area key={area.key} type="monotone" dataKey={area.key} stroke={area.color} strokeWidth={2} fill={`url(#gradient-${area.key})`} name={area.name} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface DonutChartProps {
  data: { name: string; value: number; color?: string }[];
  height?: number;
}

export function DonutChart({ data, height = 220 }: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export { CHART_COLORS };

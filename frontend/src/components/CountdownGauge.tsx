import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useCountdown } from '../hooks/useCountdown';

export interface CountdownGaugeProps {
  deadline: Date;
  title?: string;
  description?: string;
  onComplete?: () => void;
}

// Color stops for interpolation
const COLOR_STOPS = [
  { pct: 0, color: '#EF4444' },    // Red
  { pct: 0.25, color: '#F97316' }, // Orange
  { pct: 0.5, color: '#EAB308' },  // Yellow
  { pct: 0.75, color: '#84CC16' }, // Light Green
  { pct: 1, color: '#22C55E' },    // Green
];

function interpolateColor(pct: number) {
  let i = 1;
  for (; i < COLOR_STOPS.length - 1; i++) {
    if (pct < COLOR_STOPS[i].pct) break;
  }
  const lower = COLOR_STOPS[i - 1];
  const upper = COLOR_STOPS[i];
  const range = upper.pct - lower.pct;
  const rangePct = (pct - lower.pct) / range;
  const hex = (c: string) => c.length === 4 ? c.replace(/#(.)(.)(.)/, '#$1$1$2$2$3$3') : c;
  const parse = (c: string) => [1, 3, 5].map(i => parseInt(hex(c).substr(i, 2), 16));
  const [r1, g1, b1] = parse(lower.color);
  const [r2, g2, b2] = parse(upper.color);
  const r = Math.round(r1 + (r2 - r1) * rangePct);
  const g = Math.round(g1 + (g2 - g1) * rangePct);
  const b = Math.round(b1 + (b2 - b1) * rangePct);
  return `rgb(${r},${g},${b})`;
}

export const CountdownGauge: React.FC<CountdownGaugeProps> = ({ deadline, title, description, onComplete }) => {
  const { percent, completed, time } = useCountdown(deadline);
  React.useEffect(() => { if (completed && onComplete) onComplete(); }, [completed, onComplete]);
  const gaugeValue = percent;
  const color = interpolateColor(gaugeValue / 100);
  const data = [
    { value: gaugeValue },
    { value: 100 - gaugeValue },
  ];
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            <linearGradient id="gaugeGradient" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor="#e5e7eb" />
            </linearGradient>
          </defs>
          <Pie
            data={data}
            startAngle={180}
            endAngle={0}
            innerRadius="70%"
            outerRadius="100%"
            dataKey="value"
            stroke="none"
          >
            <Cell key="gauge" fill="url(#gaugeGradient)" />
            <Cell key="rest" fill="#e5e7eb" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', textAlign: 'center', pointerEvents: 'none' }}>
        {title && <div style={{ fontWeight: 600, fontSize: 18 }}>{title}</div>}
        <div style={{ fontSize: 24, fontWeight: 700, color }}>{completed ? 'Done!' : `${time.days}d ${time.hours}h ${time.minutes}m ${time.seconds}s`}</div>
        {description && <div style={{ color: '#6b7280', fontSize: 14 }}>{description}</div>}
      </div>
    </div>
  );
}; 
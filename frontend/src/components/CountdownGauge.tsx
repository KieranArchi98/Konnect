import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useTheme, useMediaQuery } from '@mui/material';
import { useCountdown } from '../hooks/useCountdown';

export interface CountdownGaugeProps {
  deadline: Date;
  title?: string;
  description?: string;
  onComplete?: () => void;
}

// Enhanced color stops for interpolation with better visual hierarchy
const COLOR_STOPS = [
  { pct: 0, color: '#EF4444' },    // Red - Critical
  { pct: 0.25, color: '#F97316' }, // Orange - Warning
  { pct: 0.5, color: '#EAB308' },  // Yellow - Caution
  { pct: 0.75, color: '#84CC16' }, // Light Green - Good
  { pct: 1, color: '#22C55E' },    // Green - Excellent
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [animationKey, setAnimationKey] = useState(0);
  
  useEffect(() => { 
    if (completed && onComplete) onComplete(); 
  }, [completed, onComplete]);

  // Animate the gauge periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationKey(prev => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  const gaugeValue = percent;
  const color = interpolateColor(gaugeValue / 100);
  const data = [
    { value: gaugeValue, name: 'progress' },
    { value: 100 - gaugeValue, name: 'remaining' },
  ];

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      minHeight: 0, 
      position: 'relative', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: isMobile ? '16px' : '24px',
      transition: 'all 0.3s ease'
    }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart key={animationKey}>
          <defs>
            <linearGradient id="gaugeGradient" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color} stopOpacity={0.7} />
            </linearGradient>
            <radialGradient id="gaugeRadial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity={0.8} />
              <stop offset="70%" stopColor={color} stopOpacity={0.6} />
              <stop offset="100%" stopColor={color} stopOpacity={0.3} />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.2)"/>
            </filter>
          </defs>
          <Pie
            data={data}
            startAngle={180}
            endAngle={0}
            innerRadius={isMobile ? "65%" : "70%"}
            outerRadius="100%"
            dataKey="value"
            stroke="none"
            paddingAngle={2}
          >
            <Cell 
              key="progress" 
              fill="url(#gaugeRadial)"
              filter="url(#shadow)"
            />
            <Cell 
              key="remaining" 
              fill="#f3f4f6" 
              stroke="#e5e7eb"
              strokeWidth={1}
            />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      {/* Centered Countdown Timer */}
      <div style={{ 
        position: 'absolute', 
        left: 0, 
        right: 0, 
        top: isMobile ? '55%' : '50%', 
        transform: 'translateY(-50%)', 
        textAlign: 'center', 
        pointerEvents: 'none',
        padding: isMobile ? '8px' : '16px'
      }}>
        {title && (
          <div style={{ 
            fontWeight: 600, 
            fontSize: isMobile ? 14 : 18,
            color: '#2A2A2A',
            marginBottom: '8px',
            letterSpacing: '-0.02em'
          }}>
            {title}
          </div>
        )}
        
        <div style={{ 
          fontSize: isMobile ? 18 : 24, 
          fontWeight: 700, 
          color,
          fontFamily: 'monospace',
          letterSpacing: '1px',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '8px'
        }}>
          {completed ? (
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              animation: 'pulse 2s infinite'
            }}>
              <span style={{ 
                fontSize: isMobile ? 16 : 20,
                animation: 'bounce 1s infinite'
              }}>✓</span>
              Done!
            </span>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: '4px'
            }}>
              <div style={{ 
                display: 'flex', 
                gap: isMobile ? '4px' : '8px',
                alignItems: 'center'
              }}>
                <span style={{ 
                  animation: time.days > 0 ? 'fadeInOut 2s infinite' : 'none'
                }}>{String(time.days).padStart(2, '0')}d</span>
                <span style={{ 
                  animation: time.hours > 0 ? 'fadeInOut 2s infinite 0.5s' : 'none'
                }}>{String(time.hours).padStart(2, '0')}h</span>
                <span style={{ 
                  animation: time.minutes > 0 ? 'fadeInOut 2s infinite 1s' : 'none'
                }}>{String(time.minutes).padStart(2, '0')}m</span>
                <span style={{ 
                  animation: 'fadeInOut 2s infinite 1.5s'
                }}>{String(time.seconds).padStart(2, '0')}s</span>
              </div>
            </div>
          )}
        </div>
        
        {description && (
          <div style={{ 
            color: '#6B7280', 
            fontSize: isMobile ? 12 : 14,
            fontWeight: 500,
            lineHeight: 1.4,
            maxWidth: '200px',
            margin: '0 auto',
            animation: 'fadeIn 1s ease-out'
          }}>
            {description}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-3px); }
          60% { transform: translateY(-1px); }
        }
        @keyframes fadeInOut {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}; 
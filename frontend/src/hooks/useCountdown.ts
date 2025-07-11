import { useEffect, useState } from 'react';

export interface Countdown {
  remaining: number; // ms
  percent: number; // 0-100
  completed: boolean;
  time: { days: number; hours: number; minutes: number; seconds: number; ms: number };
}

export function useCountdown(deadline: Date | number) {
  const deadlineMs = typeof deadline === 'number' ? deadline : deadline.getTime();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, []);

  const remaining = Math.max(0, deadlineMs - now);
  const total = Math.max(1, deadlineMs - (now - remaining));
  const percent = Math.min(100, 100 - (remaining / total) * 100);
  const completed = remaining === 0;
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((remaining / (1000 * 60)) % 60);
  const seconds = Math.floor((remaining / 1000) % 60);
  const ms = remaining % 1000;

  return {
    remaining,
    percent,
    completed,
    time: { days, hours, minutes, seconds, ms },
  };
} 
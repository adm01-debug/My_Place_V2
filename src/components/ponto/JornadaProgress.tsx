import React from 'react';

interface JornadaProgressProps {
  workedMinutes: number;
  targetMinutes?: number;
}

export function JornadaProgress({ workedMinutes, targetMinutes = 480 }: JornadaProgressProps) {
  const percentage = Math.min((workedMinutes / targetMinutes) * 100, 100);
  const overTime = workedMinutes > targetMinutes;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    return `${h}:${String(m).padStart(2, '0')}`;
  };

  const remaining = Math.max(0, targetMinutes - workedMinutes);

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={radius} fill="none"
          stroke={overTime ? 'hsl(var(--primary))' : 'hsl(var(--chart-2))'}
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground tabular-nums">{formatTime(workedMinutes)}</span>
        <span className="text-xs text-muted-foreground">
          {overTime ? `+${formatTime(workedMinutes - targetMinutes)} extra` : `faltam ${formatTime(remaining)}`}
        </span>
      </div>
    </div>
  );
}

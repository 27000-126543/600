import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  icon: React.ReactNode;
  color?: string;
}

export default function KpiCard({ title, value, unit, trend, trendValue, icon, color = '#0B2A5A' }: KpiCardProps) {
  const [displayValue, setDisplayValue] = useState<string | number>('--');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(value);
      setLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  const trendConfig = {
    up: { icon: TrendingUp, color: 'text-success-500', label: '上升' },
    down: { icon: TrendingDown, color: 'text-warning-high', label: '下降' },
    flat: { icon: Minus, color: 'text-gray-400', label: '持平' },
  };

  const TrendIcon = trend ? trendConfig[trend].icon : null;
  const trendColor = trend ? trendConfig[trend].color : '';

  return (
    <div className="card relative flex overflow-hidden p-0">
      <div className="w-1.5 shrink-0" style={{ backgroundColor: color }} />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">{title}</span>
          <span className="text-gray-400" style={{ color }}>{icon}</span>
        </div>
        <div className={cn('flex items-baseline gap-1.5', loaded && 'animate-count')}>
          <span className="text-3xl font-bold text-gray-800">{displayValue}</span>
          {unit && <span className="text-sm text-gray-400">{unit}</span>}
        </div>
        {trend && trendValue && (
          <div className={cn('flex items-center gap-1 text-sm', trendColor)}>
            {TrendIcon && <TrendIcon className="h-4 w-4" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Stats Card Component for Dashboard
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color?: 'indigo' | 'green' | 'yellow' | 'red' | 'purple' | 'blue';
  prefix?: string;
  suffix?: string;
}

const colorMap = {
  indigo: { bg: 'bg-indigo-500/10', icon: 'text-indigo-400', border: 'border-indigo-500/20' },
  green: { bg: 'bg-green-500/10', icon: 'text-green-400', border: 'border-green-500/20' },
  yellow: { bg: 'bg-yellow-500/10', icon: 'text-yellow-400', border: 'border-yellow-500/20' },
  red: { bg: 'bg-red-500/10', icon: 'text-red-400', border: 'border-red-500/20' },
  purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', border: 'border-purple-500/20' },
  blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400', border: 'border-blue-500/20' },
};

export default function StatsCard({
  title, value, icon: Icon, trend, trendLabel, color = 'indigo', prefix = '', suffix = '',
}: StatsCardProps) {
  const colors = colorMap[color];
  const isPositive = (trend ?? 0) >= 0;

  return (
    <div className={`bg-gray-900 border ${colors.border} rounded-2xl p-5 hover:border-opacity-60 transition-all duration-200 hover:shadow-lg hover:shadow-black/20`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colors.bg}`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
            isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-gray-500 text-sm mb-1">{title}</p>
        <p className="text-white text-2xl font-bold">
          {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}{suffix}
        </p>
        {trendLabel && (
          <p className="text-gray-600 text-xs mt-1">{trendLabel}</p>
        )}
      </div>
    </div>
  );
}

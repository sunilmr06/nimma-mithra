import React from 'react';
import Card from './Card';

const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'primary', // 'primary', 'cyan', 'warning', 'success', 'critical'
  trend,
  className = '',
}) => {
  const colorMap = {
    primary: {
      bg: 'bg-primary/10',
      text: 'text-primary-light',
      border: 'border-primary/20',
      glow: 'group-hover:border-primary/40',
    },
    cyan: {
      bg: 'bg-cyan/10',
      text: 'text-cyan-light',
      border: 'border-cyan/20',
      glow: 'group-hover:border-cyan/40',
    },
    warning: {
      bg: 'bg-warning/10',
      text: 'text-warning',
      border: 'border-warning/20',
      glow: 'group-hover:border-warning/40',
    },
    success: {
      bg: 'bg-success/10',
      text: 'text-success',
      border: 'border-success/20',
      glow: 'group-hover:border-success/40',
    },
    critical: {
      bg: 'bg-critical/10',
      text: 'text-critical',
      border: 'border-critical/20',
      glow: 'group-hover:border-critical/40',
    },
  };

  const scheme = colorMap[color] || colorMap.primary;

  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 ${scheme.glow} ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl font-bold text-main mt-2 tracking-tight">{value}</h4>
          {subtext && <p className="text-xs text-muted mt-1.5">{subtext}</p>}
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl border ${scheme.bg} ${scheme.text} ${scheme.border} transition-transform duration-300 group-hover:scale-110`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
          <span className="text-muted">{trend.label}</span>
          <span className={`font-semibold ${trend.positive ? 'text-success' : 'text-warning'}`}>
            {trend.value}
          </span>
        </div>
      )}
    </Card>
  );
};

export default StatCard;

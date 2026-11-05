import React from 'react';

export const StatusBadge = ({ status }) => {
  const statusConfig = {
    submitted: {
      label: 'Submitted',
      classes: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      dot: 'bg-indigo-400',
    },
    acknowledged: {
      label: 'Acknowledged',
      classes: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      dot: 'bg-cyan-400',
    },
    assigned: {
      label: 'Assigned',
      classes: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      dot: 'bg-blue-400',
    },
    in_progress: {
      label: 'In Progress',
      classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      dot: 'bg-amber-400 animate-pulse',
    },
    resolved: {
      label: 'Resolved',
      classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      dot: 'bg-emerald-400',
    },
    reopened: {
      label: 'Reopened',
      classes: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      dot: 'bg-purple-400 animate-pulse',
    },
  };

  const config = statusConfig[status] || {
    label: status ? status.replace('_', ' ') : 'Unknown',
    classes: 'bg-slate-700/30 text-muted border-slate-700',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export const PriorityBadge = ({ level, score }) => {
  const levelConfig = {
    low: {
      label: 'Low',
      classes: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
      bar: 'bg-slate-400',
    },
    medium: {
      label: 'Medium',
      classes: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      bar: 'bg-blue-400',
    },
    high: {
      label: 'High',
      classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      bar: 'bg-amber-400',
    },
    critical: {
      label: 'Critical',
      classes: 'bg-red-500/15 text-red-300 border-red-500/30 animate-pulse',
      bar: 'bg-red-500',
    },
  };

  const key = (level || 'low').toLowerCase();
  const config = levelConfig[key] || levelConfig.low;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.bar}`} />
      <span>{config.label}</span>
      {score !== undefined && score !== null && (
        <span className="opacity-75 font-mono text-[11px]">({score})</span>
      )}
    </span>
  );
};

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

const PriorityBarChart = ({ data = [] }) => {
  const COLOR_MAP = {
    low: '#94A3B8',
    medium: '#3B82F6',
    high: '#F59E0B',
    critical: '#EF4444',
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-muted">
        No priority distribution data available.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-elevated border border-border p-2.5 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-semibold text-main">{label} Priority</p>
          <p className="text-muted">{payload[0]?.value} active complaints</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#273449" horizontal={false} />
          <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
          <YAxis dataKey="label" type="category" stroke="#94A3B8" fontSize={11} tickLine={false} width={65} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]}>
            {data.map((entry) => (
              <Cell key={entry.level} fill={COLOR_MAP[entry.level] || '#6366F1'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriorityBarChart;

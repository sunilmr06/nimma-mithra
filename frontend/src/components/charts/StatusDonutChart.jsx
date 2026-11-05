import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const StatusDonutChart = ({ data = [] }) => {
  const COLOR_MAP = {
    submitted: '#6366F1',     // Indigo
    acknowledged: '#06B6D4',  // Cyan
    assigned: '#3B82F6',      // Blue
    in_progress: '#F59E0B',   // Amber
    resolved: '#22C55E',      // Emerald
    reopened: '#A855F7',      // Purple
  };

  const chartData = data.filter((d) => d.count > 0);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-muted">
        No complaint status data available.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-elevated border border-border p-2.5 rounded-xl shadow-xl text-xs">
          <p className="font-semibold text-main">{item.label}</p>
          <p className="text-muted">{item.count} complaints</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="count"
            nameKey="label"
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.status}
                fill={COLOR_MAP[entry.status] || '#64748B'}
                stroke="#151E30"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-xs text-muted">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatusDonutChart;

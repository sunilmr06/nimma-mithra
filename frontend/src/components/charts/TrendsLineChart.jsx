import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

const TrendsLineChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-muted">
        No trend data available.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-elevated border border-border p-2.5 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-semibold text-main">{label}</p>
          <p className="text-primary-light">Reported: {payload[0]?.value}</p>
          <p className="text-success">Resolved: {payload[1]?.value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#273449" vertical={false} />
          <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
          <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={30}
            iconType="circle"
            formatter={(value) => <span className="text-xs text-muted">{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="reported"
            name="Reported"
            stroke="#6366F1"
            strokeWidth={3}
            dot={{ r: 4, fill: '#6366F1' }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="resolved"
            name="Resolved"
            stroke="#22C55E"
            strokeWidth={3}
            dot={{ r: 4, fill: '#22C55E' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendsLineChart;

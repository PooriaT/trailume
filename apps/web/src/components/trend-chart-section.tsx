"use client";

import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  Line,
} from "recharts";

interface TrendPoint {
  date: string;
  distanceKm: number;
  activityCount: number;
}

export function TrendChartSection({ points }: { points: TrendPoint[] }) {
  if (!points.length) {
    return (
      <section className="panel-subtle">
        <h2>Momentum trend</h2>
        <p>Not enough data to show a trend chart.</p>
      </section>
    );
  }

  return (
    <section className="panel chart-panel recap-section">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Pattern</p>
          <h2>Momentum trend</h2>
        </div>
      </div>
      <div className="chart-shell">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="distanceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
            <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
              }}
            />
            <Area type="monotone" dataKey="distanceKm" stroke="#4f46e5" fill="url(#distanceFill)" strokeWidth={2} />
            <Line type="monotone" dataKey="activityCount" stroke="#0f766e" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

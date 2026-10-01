"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { EquityPoint } from "@tickerapp/analytics";

interface BacktestEquityChartProps {
  points: EquityPoint[];
}

export function BacktestEquityChart({
  points,
}: BacktestEquityChartProps) {
  if (points.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-border bg-background/50">
        <div className="text-center">
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-surface font-mono text-[10px] text-muted">
            EQ
          </div>

          <p className="mt-3 text-xs font-medium text-foreground">
            No equity data available
          </p>

          <p className="mt-1 text-[10px] text-muted">
            Run the backtest to generate the equity curve.
          </p>
        </div>
      </div>
    );
  }

  const data = points.map((point) => ({
    ...point,
    label: formatDate(point.timestamp),
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 16,
            right: 18,
            left: 4,
            bottom: 8,
          }}
        >
          <CartesianGrid
            stroke="rgba(255,255,255,0.045)"
            strokeDasharray="2 4"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            axisLine={{
              stroke: "rgba(255,255,255,0.08)",
            }}
            tickLine={false}
            tick={{
              fill: "rgba(167,176,189,0.8)",
              fontSize: 10,
            }}
            minTickGap={36}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "rgba(167,176,189,0.8)",
              fontSize: 10,
            }}
            tickFormatter={(value) =>
              formatAxisValue(Number(value))
            }
            width={70}
          />

          <Tooltip
            cursor={{
              stroke: "rgba(53,208,127,0.25)",
              strokeWidth: 1,
            }}
            contentStyle={{
              background: "#0c1017",
              border: "1px solid #1d2633",
              borderRadius: "10px",
              boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
              fontSize: "11px",
              color: "#f5f7fa",
            }}
            labelStyle={{
              color: "#7f8a9a",
              marginBottom: "4px",
              fontSize: "10px",
            }}
            itemStyle={{
              color: "#35d07f",
              fontFamily: "monospace",
            }}
            formatter={(value) =>
              formatCurrency(Number(value))
            }
            labelFormatter={(label) => String(label)}
          />

          <Line
            type="monotone"
            dataKey="equity"
            name="Equity"
            stroke="#35d07f"
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
              fill: "#35d07f",
              stroke: "#07090d",
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  }).format(date);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatAxisValue(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }

  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }

  return `$${value.toFixed(0)}`;
}
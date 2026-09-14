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
      <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border bg-background text-sm text-muted">
        No equity data available.
      </div>
    );
  }

  const data = points.map(
    (point) => ({
      ...point,
      label: formatDate(
        point.timestamp,
      ),
    }),
  );

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <LineChart
          data={data}
          margin={{
            top: 12,
            right: 12,
            left: 0,
            bottom: 8,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            tick={{
              fontSize: 11,
            }}
            minTickGap={32}
          />

          <YAxis
            tick={{
              fontSize: 11,
            }}
            tickFormatter={(value) =>
              formatAxisValue(
                value,
              )
            }
            width={72}
          />

          <Tooltip
            formatter={(value) =>
              formatCurrency(
                Number(value),
              )
            }
            labelFormatter={(label) =>
              String(label)
            }
          />

          <Line
            type="monotone"
            dataKey="equity"
            name="Equity"
            stroke="currentColor"
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatDate(
  timestamp: string,
): string {
  const date = new Date(
    timestamp,
  );

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "2-digit",
    },
  ).format(date);
}

function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    },
  ).format(value);
}

function formatAxisValue(
  value: number,
): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(
      value / 1_000_000
    ).toFixed(1)}M`;
  }

  if (Math.abs(value) >= 1_000) {
    return `$${(
      value / 1_000
    ).toFixed(1)}K`;
  }

  return `$${value.toFixed(0)}`;
}
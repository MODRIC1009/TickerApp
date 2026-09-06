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

import type { OHLCVBar } from "@tickerapp/shared";

interface PriceHistoryChartProps {
  bars: OHLCVBar[];
}

interface ChartPoint {
  timestamp: string;
  price: number;
}

function formatDate(timestamp: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

function formatPrice(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function PriceHistoryChart({
  bars,
}: PriceHistoryChartProps) {
  const data: ChartPoint[] = bars.map((bar) => ({
    timestamp: formatDate(bar.timestamp),
    price: bar.close,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-strong">
            No historical price data available.
          </p>
          <p className="mt-2 text-xs text-muted">
            Try again later or select a different instrument.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-80 w-full p-4">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <LineChart
          data={data}
          margin={{
            top: 8,
            right: 12,
            left: 8,
            bottom: 8,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border-subtle"
          />

          <XAxis
            dataKey="timestamp"
            tickLine={false}
            axisLine={false}
            minTickGap={32}
            className="text-[10px]"
          />

          <YAxis
            domain={["auto", "auto"]}
            tickFormatter={formatPrice}
            tickLine={false}
            axisLine={false}
            width={72}
            className="text-[10px]"
          />

          <Tooltip
            formatter={(value) => [
              formatPrice(Number(value)),
              "Close",
            ]}
            labelFormatter={(label) => String(label)}
            contentStyle={{
              background: "var(--color-surface-elevated)",
              border:
                "1px solid var(--color-border)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />

          <Line
            type="monotone"
            dataKey="price"
            name="Close"
            stroke="var(--color-accent)"
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
"use client";

import {
  useMemo,
  useState,
} from "react";

import type { OHLCVBar } from "@tickerapp/shared";

interface PriceHistoryChartProps {
  bars: OHLCVBar[];
}

type Range = "1M" | "3M" | "6M" | "1Y";

const ranges: {
  label: Range;
  days: number;
}[] = [
  { label: "1M", days: 31 },
  { label: "3M", days: 93 },
  { label: "6M", days: 186 },
  { label: "1Y", days: 365 },
];

function formatDate(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
}

function formatAxisDate(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    },
  );
}

function formatPrice(value: number) {
  return value.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}

function formatVolume(value: number) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }

  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }

  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }

  return value.toLocaleString(
    "en-US",
    {
      maximumFractionDigits: 0,
    },
  );
}

function getPeriodChangeClass(
  change: number | null,
) {
  if (
    change === null ||
    change === 0
  ) {
    return "text-muted";
  }

  return change > 0
    ? "text-accent"
    : "text-negative";
}

export function PriceHistoryChart({
  bars,
}: PriceHistoryChartProps) {
  const [range, setRange] =
    useState<Range>("1Y");

  const [hoveredIndex, setHoveredIndex] =
    useState<number | null>(null);

  const filteredBars = useMemo(() => {
    if (bars.length === 0) {
      return [];
    }

    const selectedRange =
      ranges.find(
        (item) => item.label === range,
      ) ?? ranges[3];

    const cutoff = new Date();

    cutoff.setDate(
      cutoff.getDate() -
        selectedRange.days,
    );

    const filtered = bars.filter(
      (bar) => {
        const timestamp = new Date(
          bar.timestamp,
        );

        return (
          !Number.isNaN(
            timestamp.getTime(),
          ) &&
          timestamp >= cutoff
        );
      },
    );

    return filtered.length >= 2
      ? filtered
      : bars.slice(
          -Math.min(60, bars.length),
        );
  }, [bars, range]);

  const chart = useMemo(() => {
    if (filteredBars.length < 2) {
      return null;
    }

    const width = 1000;
    const height = 390;

    const padding = {
      top: 28,
      right: 24,
      bottom: 46,
      left: 72,
    };

    const chartWidth =
      width -
      padding.left -
      padding.right;

    const chartHeight =
      height -
      padding.top -
      padding.bottom;

    const prices = filteredBars.map(
      (bar) => bar.close,
    );

    const minimum = Math.min(
      ...prices,
    );

    const maximum = Math.max(
      ...prices,
    );

    const spread =
      maximum - minimum;

    const safeSpread =
      spread === 0
        ? Math.max(
            Math.abs(maximum) * 0.02,
            1,
          )
        : spread;

    const chartMin =
      minimum - safeSpread * 0.08;

    const chartMax =
      maximum + safeSpread * 0.08;

    const points = filteredBars.map(
      (bar, index) => {
        const x =
          padding.left +
          (index /
            Math.max(
              filteredBars.length - 1,
              1,
            )) *
            chartWidth;

        const y =
          padding.top +
          ((chartMax - bar.close) /
            (chartMax - chartMin)) *
            chartHeight;

        return {
          x,
          y,
          bar,
        };
      },
    );

    const linePath = points
      .map(
        (point, index) =>
          `${
            index === 0
              ? "M"
              : "L"
          } ${point.x.toFixed(
            2,
          )} ${point.y.toFixed(2)}`,
      )
      .join(" ");

    const areaPath = [
      `M ${points[0].x.toFixed(
        2,
      )} ${(
        padding.top +
        chartHeight
      ).toFixed(2)}`,
      ...points.map(
        (point) =>
          `L ${point.x.toFixed(
            2,
          )} ${point.y.toFixed(2)}`,
      ),
      `L ${
        points[
          points.length - 1
        ].x.toFixed(2)
      } ${(
        padding.top +
        chartHeight
      ).toFixed(2)}`,
      "Z",
    ].join(" ");

    const gridLines = Array.from(
      { length: 5 },
      (_, index) => {
        const ratio = index / 4;

        const y =
          padding.top +
          ratio * chartHeight;

        const value =
          chartMax -
          ratio *
            (chartMax - chartMin);

        return {
          y,
          value,
        };
      },
    );

    const xLabels = [
      points[0],
      points[
        Math.floor(
          points.length / 2,
        )
      ],
      points[points.length - 1],
    ];

    return {
      width,
      height,
      padding,
      chartWidth,
      chartHeight,
      minimum,
      maximum,
      points,
      linePath,
      areaPath,
      gridLines,
      xLabels,
    };
  }, [filteredBars]);

  const firstPrice =
    filteredBars[0]?.close;

  const lastPrice =
    filteredBars[
      filteredBars.length - 1
    ]?.close;

  const periodChange =
    firstPrice !== undefined &&
    lastPrice !== undefined &&
    firstPrice !== 0
      ? ((lastPrice - firstPrice) /
          firstPrice) *
        100
      : null;

  const periodHigh =
    filteredBars.length > 0
      ? Math.max(
          ...filteredBars.map(
            (bar) => bar.high,
          ),
        )
      : null;

  const periodLow =
    filteredBars.length > 0
      ? Math.min(
          ...filteredBars.map(
            (bar) => bar.low,
          ),
        )
      : null;

  const averageVolume =
    filteredBars.length > 0
      ? filteredBars.reduce(
          (total, bar) =>
            total + bar.volume,
          0,
        ) / filteredBars.length
      : null;

  const selectedPoint =
    hoveredIndex !== null
      ? chart?.points[hoveredIndex]
      : null;

  if (!chart) {
    return (
      <div className="flex min-h-64 items-center justify-center px-6 text-center">
        <div>
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-background/40 text-muted">
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M4 19V5" />
              <path d="M4 19h16" />
              <path d="m7 15 3-4 3 2 5-7" />
            </svg>
          </div>

          <p className="mt-3 text-xs font-medium text-foreground">
            Not enough historical data
          </p>

          <p className="mt-1 text-[10px] text-muted">
            At least two valid observations are required.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative p-4 sm:p-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/[0.035] blur-3xl"
      />

      <div className="relative mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xl font-semibold tracking-tight text-foreground">
              {formatPrice(lastPrice)}
            </span>

            {periodChange !== null ? (
              <span
                className={`font-mono text-xs font-medium ${getPeriodChangeClass(
                  periodChange,
                )}`}
              >
                {periodChange > 0
                  ? "+"
                  : ""}
                {periodChange.toFixed(2)}%
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-[11px] text-muted">
            {formatDate(
              filteredBars[
                filteredBars.length - 1
              ].timestamp,
            )}
          </p>
        </div>

        <div
          className="flex items-center gap-1 self-start rounded-lg border border-border-subtle bg-background p-1"
          role="group"
          aria-label="Chart time range"
        >
          {ranges.map((item) => {
            const active =
              range === item.label;

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setRange(item.label);
                  setHoveredIndex(null);
                }}
                className={`rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                  active
                    ? "bg-surface-hover text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]"
                    : "text-muted hover:text-foreground"
                }`}
                aria-pressed={active}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-border-subtle bg-background/35 px-3 py-2.5">
          <p className="text-[8px] uppercase tracking-[0.13em] text-muted">
            Period high
          </p>

          <p className="mt-1 font-mono text-[11px] font-medium text-foreground">
            {periodHigh !== null
              ? formatPrice(periodHigh)
              : "—"}
          </p>
        </div>

        <div className="rounded-xl border border-border-subtle bg-background/35 px-3 py-2.5">
          <p className="text-[8px] uppercase tracking-[0.13em] text-muted">
            Period low
          </p>

          <p className="mt-1 font-mono text-[11px] font-medium text-foreground">
            {periodLow !== null
              ? formatPrice(periodLow)
              : "—"}
          </p>
        </div>

        <div className="rounded-xl border border-border-subtle bg-background/35 px-3 py-2.5">
          <p className="text-[8px] uppercase tracking-[0.13em] text-muted">
            Avg volume
          </p>

          <p className="mt-1 font-mono text-[11px] font-medium text-foreground">
            {averageVolume !== null
              ? formatVolume(
                  averageVolume,
                )
              : "—"}
          </p>
        </div>

        <div className="hidden rounded-xl border border-border-subtle bg-background/35 px-3 py-2.5 sm:block">
          <p className="text-[8px] uppercase tracking-[0.13em] text-muted">
            Observations
          </p>

          <p className="mt-1 font-mono text-[11px] font-medium text-foreground">
            {filteredBars.length}
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-background/40">
        <svg
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`Price history chart from ${formatDate(
            filteredBars[0].timestamp,
          )} to ${formatDate(
            filteredBars[
              filteredBars.length - 1
            ].timestamp,
          )}`}
          onMouseLeave={() =>
            setHoveredIndex(null)
          }
        >
          <defs>
            <linearGradient
              id="price-area-gradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="currentColor"
                stopOpacity="0.18"
              />

              <stop
                offset="100%"
                stopColor="currentColor"
                stopOpacity="0"
              />
            </linearGradient>

            <filter
              id="price-line-glow"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feGaussianBlur
                stdDeviation="3"
                result="blur"
              />

              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {chart.gridLines.map(
            (line, index) => (
              <g key={index}>
                <line
                  x1={chart.padding.left}
                  x2={
                    chart.width -
                    chart.padding.right
                  }
                  y1={line.y}
                  y2={line.y}
                  stroke="currentColor"
                  strokeOpacity="0.07"
                  strokeWidth="1"
                />

                <text
                  x={
                    chart.padding.left -
                    10
                  }
                  y={line.y + 4}
                  textAnchor="end"
                  className="fill-muted text-[11px]"
                >
                  {formatPrice(
                    line.value,
                  )}
                </text>
              </g>
            ),
          )}

          {chart.xLabels.map(
            (point, index) => (
              <text
                key={`${point.bar.timestamp}-${index}`}
                x={point.x}
                y={
                  chart.height - 15
                }
                textAnchor={
                  index === 0
                    ? "start"
                    : index ===
                        chart.xLabels.length -
                          1
                      ? "end"
                      : "middle"
                }
                className="fill-muted text-[11px]"
              >
                {formatAxisDate(
                  point.bar.timestamp,
                )}
              </text>
            ),
          )}

          <path
            d={chart.areaPath}
            fill="url(#price-area-gradient)"
            className="text-accent"
          />

          <path
            d={chart.linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
            filter="url(#price-line-glow)"
          />

          {selectedPoint ? (
            <>
              <line
                x1={selectedPoint.x}
                x2={selectedPoint.x}
                y1={chart.padding.top}
                y2={
                  chart.padding.top +
                  chart.chartHeight
                }
                stroke="currentColor"
                strokeOpacity="0.18"
                strokeDasharray="4 5"
                className="text-accent"
              />

              <circle
                cx={selectedPoint.x}
                cy={selectedPoint.y}
                r="8"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.16"
                className="text-accent"
              />

              <circle
                cx={selectedPoint.x}
                cy={selectedPoint.y}
                r="4"
                fill="currentColor"
                className="text-accent"
              />
            </>
          ) : (
            <circle
              cx={
                chart.points[
                  chart.points.length - 1
                ].x
              }
              cy={
                chart.points[
                  chart.points.length - 1
                ].y
              }
              r="4"
              fill="currentColor"
              className="text-accent"
            />
          )}

          {chart.points.map(
            (point, index) => (
              <rect
                key={`hit-${point.bar.timestamp}-${index}`}
                x={
                  point.x -
                  chart.chartWidth /
                    Math.max(
                      chart.points.length -
                        1,
                      1,
                    ) /
                    2
                }
                y={chart.padding.top}
                width={
                  chart.chartWidth /
                  Math.max(
                    chart.points.length -
                      1,
                    1,
                  )
                }
                height={
                  chart.chartHeight
                }
                fill="transparent"
                onMouseEnter={() =>
                  setHoveredIndex(index)
                }
                onFocus={() =>
                  setHoveredIndex(index)
                }
              />
            ),
          )}
        </svg>

        {selectedPoint ? (
          <div className="pointer-events-none absolute left-3 top-3 rounded-xl border border-border bg-surface/95 px-3 py-2 shadow-[0_12px_35px_rgba(0,0,0,0.24)] backdrop-blur-xl">
            <p className="text-[8px] uppercase tracking-[0.12em] text-muted">
              {formatDate(
                selectedPoint.bar.timestamp,
              )}
            </p>

            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-sm font-semibold text-foreground">
                {formatPrice(
                  selectedPoint.bar.close,
                )}
              </span>

              <span className="font-mono text-[9px] text-muted">
                O {formatPrice(
                  selectedPoint.bar.open,
                )}
              </span>
            </div>

            <div className="mt-1 flex gap-3 text-[8px] text-muted">
              <span>
                H{" "}
                {formatPrice(
                  selectedPoint.bar.high,
                )}
              </span>

              <span>
                L{" "}
                {formatPrice(
                  selectedPoint.bar.low,
                )}
              </span>

              <span>
                V{" "}
                {formatVolume(
                  selectedPoint.bar.volume,
                )}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-2 text-[10px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>
          Low{" "}
          <span className="font-mono text-muted-strong">
            {formatPrice(chart.minimum)}
          </span>
        </span>

        <span className="font-mono text-[9px] uppercase tracking-[0.1em]">
          Hover chart for OHLCV
        </span>

        <span>
          High{" "}
          <span className="font-mono text-muted-strong">
            {formatPrice(chart.maximum)}
          </span>
        </span>
      </div>
    </div>
  );
}
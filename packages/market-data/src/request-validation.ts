export const HISTORICAL_INTERVALS = [
  "1d",
  "1h",
  "15m",
  "5m",
] as const;

export type HistoricalInterval =
  (typeof HISTORICAL_INTERVALS)[number];

export interface HistoricalRequestInput {
  symbol: string;
  startDate: string;
  endDate: string;
  interval: HistoricalInterval;
}

export function validateSymbol(symbol: string): string {
  const normalizedSymbol = symbol.trim().toUpperCase();

  if (!normalizedSymbol) {
    throw new Error("Symbol cannot be empty.");
  }

  if (normalizedSymbol.length > 32) {
    throw new Error("Symbol cannot exceed 32 characters.");
  }

  return normalizedSymbol;
}

export function validateDateRange(
  startDate: string,
  endDate: string,
): {
  startDate: string;
  endDate: string;
} {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    throw new Error("Invalid date range.");
  }

  if (start > end) {
    throw new Error("Start date must be before end date.");
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export function validateHistoricalInterval(
  interval: string,
): HistoricalInterval {
  if (
    !HISTORICAL_INTERVALS.includes(
      interval as HistoricalInterval,
    )
  ) {
    throw new Error(
      `Unsupported historical interval "${interval}".`,
    );
  }

  return interval as HistoricalInterval;
}
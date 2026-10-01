import { NextResponse } from "next/server";

import type { Quote } from "@tickerapp/shared";

export type MarketDataErrorCode =
  | "invalid_request"
  | "not_found"
  | "provider_unavailable"
  | "rate_limited"
  | "provider_error"
  | "internal_error";

export type MarketDataError = {
  error: string;
  code: MarketDataErrorCode;
};

type QuoteResponse = {
  quote?: Quote;
  error?: string;
};

type InstrumentResponse = {
  instrument?: Record<string, unknown>;
  identity?: Record<string, unknown>;
  error?: string;
};

export type HistoricalPriceRequest = {
  symbol: string;
  interval?: string;
  startDate?: string;
  endDate?: string;
  outputSize?: number;
};

export type HistoricalPrice = {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type HistoricalPriceResponse = {
  symbol: string;
  currency: string;
  interval: string;
  values: HistoricalPrice[];
};

type HistoryResponse = {
  data?: HistoricalPriceResponse;
  error?: string;
};

function errorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "";
}

export function getMarketDataErrorStatus(
  error: unknown,
): number {
  const message =
    errorMessage(error).toLowerCase();

  if (
    message.includes("rate limit") ||
    message.includes("rate_limited") ||
    message.includes("too many requests")
  ) {
    return 429;
  }

  if (
    message.includes("not found") ||
    message.includes("unknown symbol") ||
    message.includes("instrument not found")
  ) {
    return 404;
  }

  if (
    message.includes("invalid") ||
    message.includes("required")
  ) {
    return 400;
  }

  if (
    message.includes("unavailable") ||
    message.includes("timeout") ||
    message.includes("timed out")
  ) {
    return 503;
  }

  return 500;
}

function getMarketDataErrorCode(
  status: number,
): MarketDataErrorCode {
  if (status === 400) {
    return "invalid_request";
  }

  if (status === 404) {
    return "not_found";
  }

  if (status === 429) {
    return "rate_limited";
  }

  if (status === 503) {
    return "provider_unavailable";
  }

  return "internal_error";
}

export function marketDataErrorResponse(
  error: unknown,
  fallbackMessage?: string,
) {
  const status =
    getMarketDataErrorStatus(error);

  const message =
    errorMessage(error) ||
    fallbackMessage ||
    "An unexpected market-data error occurred.";

  const body: MarketDataError = {
    error: message,
    code: getMarketDataErrorCode(status),
  };

  return NextResponse.json(
    body,
    { status },
  );
}

export async function fetchQuote(
  symbol: string,
): Promise<Quote> {
  const normalizedSymbol =
    symbol.trim().toUpperCase();

  if (!normalizedSymbol) {
    throw new Error(
      "A ticker symbol is required.",
    );
  }

  const response = await fetch(
    `/api/market-data/quote?symbol=${encodeURIComponent(
      normalizedSymbol,
    )}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      await getApiError(response),
    );
  }

  const payload =
    await parseJson<QuoteResponse>(
      response,
    );

  if (!payload.quote) {
    throw new Error(
      payload.error ??
        "No quote data was returned.",
    );
  }

  return payload.quote;
}

export async function fetchInstrument(
  symbol: string,
): Promise<InstrumentResponse["instrument"]> {
  const normalizedSymbol =
    symbol.trim().toUpperCase();

  if (!normalizedSymbol) {
    throw new Error(
      "A ticker symbol is required.",
    );
  }

  const response = await fetch(
    `/api/market-data/instrument?symbol=${encodeURIComponent(
      normalizedSymbol,
    )}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      await getApiError(response),
    );
  }

  const payload =
    await parseJson<InstrumentResponse>(
      response,
    );

  if (!payload.instrument) {
    throw new Error(
      payload.error ??
        "No instrument data was returned.",
    );
  }

  return payload.instrument;
}

export async function fetchHistoricalPrices(
  request: HistoricalPriceRequest,
): Promise<HistoricalPriceResponse> {
  if (!request.symbol?.trim()) {
    throw new Error(
      "A ticker symbol is required.",
    );
  }

  const params = new URLSearchParams();

  params.set(
    "symbol",
    request.symbol.trim().toUpperCase(),
  );

  if (request.interval) {
    params.set(
      "interval",
      request.interval,
    );
  }

  if (request.startDate) {
    params.set(
      "startDate",
      request.startDate,
    );
  }

  if (request.endDate) {
    params.set(
      "endDate",
      request.endDate,
    );
  }

  if (request.outputSize !== undefined) {
    params.set(
      "outputSize",
      String(request.outputSize),
    );
  }

  const response = await fetch(
    `/api/market-data/history?${params.toString()}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      await getApiError(response),
    );
  }

  const payload =
    await parseJson<HistoryResponse>(
      response,
    );

  if (!payload.data) {
    throw new Error(
      payload.error ??
        "No historical price data was returned.",
    );
  }

  return payload.data;
}

async function parseJson<T>(
  response: Response,
): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(
      `Market-data API returned invalid JSON (${response.status}).`,
    );
  }
}

async function getApiError(
  response: Response,
): Promise<string> {
  try {
    const payload =
      await parseJson<{
        error?: string;
        message?: string;
      }>(response);

    return (
      payload.error ??
      payload.message ??
      `Market-data API request failed (${response.status}).`
    );
  } catch {
    return `Market-data API request failed (${response.status}).`;
  }
}
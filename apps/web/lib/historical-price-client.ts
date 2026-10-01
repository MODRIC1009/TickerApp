import type { OHLCVBar } from "@tickerapp/shared";

interface HistoricalPriceApiResponse {
  symbol: string;
  interval: string;
  startDate: string;
  endDate: string;
  bars: OHLCVBar[];
}

interface HistoricalPriceErrorResponse {
  error?: string;
}

export class HistoricalPriceClientError extends Error {
  readonly status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);

    this.name =
      "HistoricalPriceClientError";

    this.status = status;
  }
}

export async function getHistoricalPrices(
  symbol: string,
  startDate: string,
  endDate: string,
  interval = "1d",
): Promise<OHLCVBar[]> {
  const params = new URLSearchParams({
    symbol,
    startDate,
    endDate,
    interval,
  });

  const response = await fetch(
    `/api/market-data/history?${params.toString()}`,
  );

  let payload:
    | HistoricalPriceApiResponse
    | HistoricalPriceErrorResponse;

  try {
    payload =
      (await response.json()) as
        | HistoricalPriceApiResponse
        | HistoricalPriceErrorResponse;
  } catch {
    throw new HistoricalPriceClientError(
      "The historical price service returned an invalid response.",
      response.status,
    );
  }

  if (
    !response.ok ||
    !("bars" in payload)
  ) {
    throw new HistoricalPriceClientError(
      ("error" in payload &&
        payload.error) ||
        "Historical price request failed.",
      response.status,
    );
  }

  return payload.bars;
}
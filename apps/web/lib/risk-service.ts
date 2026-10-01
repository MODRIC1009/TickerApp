import {
  calculateRisk,
  type RiskEngineInput,
  type RiskEngineResult,
} from "@tickerapp/analytics";
import type { OHLCVBar } from "@tickerapp/shared";

import { getMarketDataService } from "@/lib/market-data";

export type RiskDataProvenance = {
  providerId: string;
  providerName: string;
  quoteTimestamp: string | null;
  historyStartDate: string;
  historyEndDate: string;
  historyBars: number;
  benchmarkSymbol: string | null;
  benchmarkBars: number;
};

export type RiskAnalysis = {
  result: RiskEngineResult;
  provenance: RiskDataProvenance;
};

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getHistoryDates(): {
  startDate: string;
  endDate: string;
} {
  const end = new Date();

  const start = new Date(end);
  start.setUTCDate(
    start.getUTCDate() - 365,
  );

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
}

function calculateReturns(
  bars: OHLCVBar[],
): number[] {
  const sortedBars = [...bars].sort(
    (left, right) =>
      new Date(left.timestamp).getTime() -
      new Date(right.timestamp).getTime(),
  );

  const returns: number[] = [];

  for (
    let index = 1;
    index < sortedBars.length;
    index += 1
  ) {
    const previousClose =
      sortedBars[index - 1]?.close;

    const currentClose =
      sortedBars[index]?.close;

    if (
      !Number.isFinite(previousClose) ||
      !Number.isFinite(currentClose) ||
      previousClose <= 0 ||
      currentClose <= 0
    ) {
      continue;
    }

    const dailyReturn =
      currentClose / previousClose - 1;

    if (Number.isFinite(dailyReturn)) {
      returns.push(dailyReturn);
    }
  }

  return returns;
}

function getBenchmarkSymbol(
  countryCode?: string,
): string | null {
  switch (countryCode?.toUpperCase()) {
    case "US":
      return "SPY";

    default:
      return null;
  }
}

export async function getRiskAnalysis(
  symbol: string,
): Promise<RiskAnalysis> {
  const normalizedSymbol =
    symbol.trim().toUpperCase();

  if (!normalizedSymbol) {
    throw new Error(
      "A valid symbol is required.",
    );
  }

  const marketDataService =
    getMarketDataService();

  const providerStatus =
    marketDataService.getProviderStatus();

  const {
    startDate,
    endDate,
  } = getHistoryDates();

  const instrument =
    await marketDataService.getInstrument(
      normalizedSymbol,
    );

  const [quote, history] =
    await Promise.all([
      marketDataService.getQuote(
        normalizedSymbol,
      ),
      marketDataService.getHistoricalPrices({
        symbol: normalizedSymbol,
        interval: "1d",
        startDate,
        endDate,
      }),
    ]);

  if (!quote) {
    throw new Error(
      `No market quote is available for "${normalizedSymbol}".`,
    );
  }

  if (history.length < 20) {
    throw new Error(
      `Insufficient historical data is available for "${normalizedSymbol}" to calculate quantitative risk reliably.`,
    );
  }

  const returns =
    calculateReturns(history);

  if (returns.length < 20) {
    throw new Error(
      `Insufficient valid price history is available for "${normalizedSymbol}" to calculate quantitative risk reliably.`,
    );
  }

  let benchmarkSymbol =
    getBenchmarkSymbol(
      instrument?.countryCode,
    );

  let benchmarkBars: OHLCVBar[] = [];

  if (benchmarkSymbol) {
    try {
      benchmarkBars =
        await marketDataService.getHistoricalPrices({
          symbol: benchmarkSymbol,
          interval: "1d",
          startDate,
          endDate,
        });
    } catch {
      benchmarkSymbol = null;
      benchmarkBars = [];
    }
  }

  const benchmarkReturns =
    calculateReturns(benchmarkBars);

  const volumeUsd =
    Number.isFinite(quote.price) &&
    Number.isFinite(quote.volume)
      ? quote.price * quote.volume
      : null;

  const input: RiskEngineInput = {
    symbol: normalizedSymbol,
    marketCap:
      quote.marketCap ?? null,
    volume:
      quote.volume ?? null,
    volumeUsd,
    beta: null,
    returns,
    benchmarkReturns:
      benchmarkReturns.length >= 20
        ? benchmarkReturns
        : null,
    currentPrice: quote.price,
    previousPeakPrice: null,
    historyDays: history.length,
  };

  const result =
    calculateRisk(input);

  return {
    result,
    provenance: {
      providerId:
        providerStatus.providerId,
      providerName:
        providerStatus.providerName,
      quoteTimestamp:
        quote.timestamp ?? null,
      historyStartDate: startDate,
      historyEndDate: endDate,
      historyBars: history.length,
      benchmarkSymbol,
      benchmarkBars:
        benchmarkBars.length,
    },
  };
}
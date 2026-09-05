import { GLOBAL_EXCHANGES } from "../exchange-catalog";

import type {
  Instrument,
  OHLCVBar,
  Quote,
} from "@tickerapp/shared";

import type {
  HistoricalPriceRequest,
  InstrumentSearchResult,
  MarketDataProvider,
  MarketDataProviderHealth,
} from "../index";

const instruments: Instrument[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    exchangeId: "nasdaq",
    countryCode: "US",
    currency: "USD",
    assetClass: "equity",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    exchangeId: "nasdaq",
    countryCode: "US",
    currency: "USD",
    assetClass: "equity",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    exchangeId: "nasdaq",
    countryCode: "US",
    currency: "USD",
    assetClass: "equity",
  },
  {
    symbol: "RELIANCE",
    name: "Reliance Industries Limited",
    exchangeId: "nse",
    countryCode: "IN",
    currency: "INR",
    assetClass: "equity",
  },
];

const quotes: Quote[] = [
  {
    symbol: "AAPL",
    price: 232.45,
    change: 1.82,
    changePercent: 0.79,
    volume: 48_210_000,
    marketCap: 3_450_000_000_000,
    timestamp: "2026-09-05T10:00:00Z",
  },
  {
    symbol: "NVDA",
    price: 178.32,
    change: -2.14,
    changePercent: -1.19,
    volume: 62_450_000,
    marketCap: 4_350_000_000_000,
    timestamp: "2026-09-05T10:00:00Z",
  },
  {
    symbol: "MSFT",
    price: 512.78,
    change: 3.26,
    changePercent: 0.64,
    volume: 18_720_000,
    marketCap: 3_810_000_000_000,
    timestamp: "2026-09-05T10:00:00Z",
  },
  {
    symbol: "RELIANCE",
    price: 1_462.5,
    change: 8.35,
    changePercent: 0.57,
    volume: 7_840_000,
    marketCap: 19_760_000_000_000,
    timestamp: "2026-09-05T10:00:00Z",
  },
];

export class DemoMarketDataProvider implements MarketDataProvider {
  readonly id = "demo";
  readonly name = "Demo Market Data";

  readonly capabilities = {
    searchInstruments: true,
    instrumentDetails: true,
    quotes: true,
    historicalPrices: true,
    exchanges: true,
  };

  async searchInstruments(
    query: string,
  ): Promise<InstrumentSearchResult[]> {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return instruments
      .filter((instrument) => {
        return (
          instrument.symbol.toLowerCase().includes(normalizedQuery) ||
          instrument.name.toLowerCase().includes(normalizedQuery)
        );
      })
      .map((instrument) => ({
        instrument,
        score:
          instrument.symbol.toLowerCase() === normalizedQuery
            ? 1
            : 0.5,
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  async getInstrument(symbol: string): Promise<Instrument | null> {
    const normalizedSymbol = symbol.trim().toUpperCase();

    return (
      instruments.find(
        (instrument) => instrument.symbol === normalizedSymbol,
      ) ?? null
    );
  }

  async getQuote(symbol: string): Promise<Quote | null> {
    const normalizedSymbol = symbol.trim().toUpperCase();

    return (
      quotes.find((quote) => quote.symbol === normalizedSymbol) ?? null
    );
  }

  async getHistoricalPrices(
    request: HistoricalPriceRequest,
  ): Promise<OHLCVBar[]> {
    const instrument = await this.getInstrument(request.symbol);

    if (!instrument) {
      return [];
    }

    const start = new Date(request.startDate);
    const end = new Date(request.endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start > end
    ) {
      return [];
    }

    const quote = await this.getQuote(instrument.symbol);

    if (!quote) {
      return [];
    }

    const bars: OHLCVBar[] = [];
    const current = new Date(start);
    let index = 0;

    while (current <= end && bars.length < 500) {
      const drift = Math.sin(index / 4) * quote.price * 0.015;
      const close = Math.max(0.01, quote.price + drift);
      const open = Math.max(0.01, close - quote.price * 0.004);
      const high = close + quote.price * 0.008;
      const low = Math.max(0.01, close - quote.price * 0.008);

      bars.push({
        timestamp: current.toISOString(),
        open,
        high,
        low,
        close,
        volume: Math.round(
          quote.volume *
            (0.7 + Math.abs(Math.sin(index)) * 0.6),
        ),
      });

      current.setUTCDate(current.getUTCDate() + 1);
      index += 1;
    }

    return bars;
  }

  async healthCheck(): Promise<MarketDataProviderHealth> {
    return {
      status: "healthy",
      checkedAt: new Date().toISOString(),
      message: "Demo market data provider is operational.",
    };
  }

  async listExchanges(): Promise<import("@tickerapp/shared").Exchange[]> {
    return GLOBAL_EXCHANGES;
  }
}
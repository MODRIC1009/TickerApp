import type { FxRate, FxRateProvider } from "../currency";
import { normalizeCurrency } from "../currency";

const DEFAULT_RATES: Record<string, number> = {
  "USD:EUR": 0.9,
  "EUR:USD": 1 / 0.9,
  "USD:GBP": 0.77,
  "GBP:USD": 1 / 0.77,
  "USD:CAD": 1.37,
  "CAD:USD": 1 / 1.37,
  "USD:CHF": 0.81,
  "CHF:USD": 1 / 0.81,
  "USD:JPY": 147,
  "JPY:USD": 1 / 147,
  "USD:INR": 84,
  "INR:USD": 1 / 84,
  "USD:AUD": 1.52,
  "AUD:USD": 1 / 1.52,
  "USD:SGD": 1.29,
  "SGD:USD": 1 / 1.29,
};

export interface DemoFxProviderOptions {
  rates?: Record<string, number>;
  asOf?: string;
}

export class DemoFxProvider implements FxRateProvider {
  private readonly rates: Record<string, number>;
  private readonly asOf: string;

  constructor(options: DemoFxProviderOptions = {}) {
    this.rates = {
      ...DEFAULT_RATES,
      ...options.rates,
    };

    this.asOf =
      options.asOf ?? "2026-09-06T00:00:00.000Z";
  }

  async getRate(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<FxRate> {
    const from = normalizeCurrency(fromCurrency);
    const to = normalizeCurrency(toCurrency);

    if (!from || !to) {
      throw new Error("Both currencies are required.");
    }

    if (from === to) {
      return {
        fromCurrency: from,
        toCurrency: to,
        rate: 1,
        asOf: this.asOf,
      };
    }

    const key = `${from}:${to}`;
    const rate = this.rates[key];

    if (!rate || !Number.isFinite(rate) || rate <= 0) {
      throw new Error(
        `No demo FX rate is available for ${from}/${to}.`,
      );
    }

    return {
      fromCurrency: from,
      toCurrency: to,
      rate,
      asOf: this.asOf,
    };
  }
}
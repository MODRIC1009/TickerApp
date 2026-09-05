import type { Exchange } from "@tickerapp/shared";

export class ExchangeRegistry {
  private readonly exchanges = new Map<string, Exchange>();

  register(exchange: Exchange): void {
    if (this.exchanges.has(exchange.id)) {
      throw new Error(
        `Exchange "${exchange.id}" is already registered.`,
      );
    }

    this.exchanges.set(exchange.id, exchange);
  }

  get(exchangeId: string): Exchange {
    const exchange = this.exchanges.get(exchangeId);

    if (!exchange) {
      throw new Error(
        `Exchange "${exchangeId}" is not registered.`,
      );
    }

    return exchange;
  }

  has(exchangeId: string): boolean {
    return this.exchanges.has(exchangeId);
  }

  list(): Exchange[] {
    return [...this.exchanges.values()];
  }

  findByCountry(countryCode: string): Exchange[] {
    const normalizedCountryCode = countryCode.trim().toUpperCase();

    return this.list().filter(
      (exchange) =>
        exchange.countryCode.toUpperCase() === normalizedCountryCode,
    );
  }

  findByRegion(region: Exchange["region"]): Exchange[] {
    return this.list().filter(
      (exchange) => exchange.region === region,
    );
  }
}
import type {
  Exchange,
  Instrument,
  OHLCVBar,
  Quote,
} from "@tickerapp/shared";

import type {
  HistoricalPriceRequest,
  InstrumentSearchResult,
  MarketDataProvider,
  MarketDataProviderHealth,
} from "./index";
import { InstrumentRegistry } from "./instrument-registry";
import { MarketDataProviderRegistry } from "./provider-registry";
import {
  createInstrumentIdentity,
  getInstrumentIdentityKey,
  normalizeSymbol,
} from "./instrument-identity";
import { MarketDataError } from "./errors";

export interface MarketDataProviderSummary {
  id: string;
  name: string;
  capabilities: MarketDataProvider["capabilities"];
}

export interface MarketDataServiceOptions {
  /**
   * When false, a failed configured provider is never
   * silently replaced with another provider.
   *
   * This is the safe production default.
   */
  allowFallback?: boolean;
}

export class MarketDataService {
  private readonly allowFallback: boolean;

  constructor(
    private readonly registry: MarketDataProviderRegistry,
    private readonly defaultProviderId: string,
    private readonly instrumentRegistry: InstrumentRegistry =
      new InstrumentRegistry(),
    options: MarketDataServiceOptions = {},
  ) {
    this.allowFallback =
      options.allowFallback ?? false;
  }

  getDefaultProvider(): MarketDataProvider {
    return this.getProvider();
  }

  getProviders(): MarketDataProvider[] {
    return this.registry.list();
  }

  getProviderSummaries(): MarketDataProviderSummary[] {
    return this.getProviders().map(
      (provider) => ({
        id: provider.id,
        name: provider.name,
        capabilities:
          provider.capabilities,
      }),
    );
  }

  getInstrumentRegistry(): InstrumentRegistry {
    return this.instrumentRegistry;
  }

  getCachedInstrument(
    countryCode: string,
    exchangeId: string,
    symbol: string,
  ): Instrument | null {
    return this.instrumentRegistry.get(
      countryCode,
      exchangeId,
      symbol,
    );
  }

  findInstrumentsBySymbol(
    symbol: string,
  ): Instrument[] {
    return this.instrumentRegistry.findBySymbol(
      symbol,
    );
  }

  findInstrumentsByCountry(
    countryCode: string,
  ): Instrument[] {
    return this.instrumentRegistry.findByCountry(
      countryCode,
    );
  }

  findInstrumentsByExchange(
    exchangeId: string,
  ): Instrument[] {
    return this.instrumentRegistry.findByExchange(
      exchangeId,
    );
  }

  findInstrumentsByCountryAndExchange(
    countryCode: string,
    exchangeId: string,
  ): Instrument[] {
    return this.instrumentRegistry.findByCountryAndExchange(
      countryCode,
      exchangeId,
    );
  }

  getInstrumentIdentity(
    instrument: Instrument,
  ): {
    symbol: string;
    exchangeId: string;
    countryCode: string;
    key: string;
  } {
    const identity =
      createInstrumentIdentity(
        instrument,
      );

    return {
      ...identity,
      key: getInstrumentIdentityKey(
        instrument,
      ),
    };
  }

  getProviderStatus(): {
    providerId: string;
    providerName: string;
    capabilities: MarketDataProvider["capabilities"];
  } {
    const provider =
      this.getDefaultProvider();

    return {
      providerId: provider.id,
      providerName: provider.name,
      capabilities:
        provider.capabilities,
    };
  }

  async getProviderHealth(
    providerId?: string,
  ): Promise<MarketDataProviderHealth> {
    const provider =
      this.getProvider(providerId);

    return provider.healthCheck();
  }

  async getHealth(): Promise<{
    status: MarketDataProviderHealth["status"];
    checkedAt: string;
    providers: Array<
      MarketDataProviderHealth & {
        providerId: string;
        providerName: string;
      }
    >;
  }> {
    const providers = await Promise.all(
      this.registry.list().map(
        async (provider) => {
          try {
            const health =
              await provider.healthCheck();

            return {
              ...health,
              providerId: provider.id,
              providerName:
                provider.name,
            };
          } catch (error) {
            return {
              providerId: provider.id,
              providerName:
                provider.name,
              status: "unavailable" as const,
              checkedAt:
                new Date().toISOString(),
              latencyMs: null,
              message:
                error instanceof Error
                  ? error.message
                  : "Health check failed.",
            };
          }
        },
      ),
    );

    const status =
      providers.some(
        (provider) =>
          provider.status ===
          "healthy",
      )
        ? "healthy"
        : providers.some(
              (provider) =>
                provider.status ===
                "degraded",
            )
          ? "degraded"
          : "unavailable";

    return {
      status,
      checkedAt:
        new Date().toISOString(),
      providers,
    };
  }

  private resolveProviderId(
    providerId?: string,
  ): string {
    const resolvedProviderId =
      providerId?.trim() ||
      this.defaultProviderId;

    if (
      !this.registry.has(
        resolvedProviderId,
      )
    ) {
      throw new MarketDataError(
        "invalid_request",
        `Unknown market data provider "${resolvedProviderId}".`,
        {
          providerId:
            resolvedProviderId,
        },
      );
    }

    return resolvedProviderId;
  }

  private getProvider(
    providerId?: string,
  ): MarketDataProvider {
    return this.registry.get(
      this.resolveProviderId(providerId),
    );
  }

  private requireCapability(
    provider: MarketDataProvider,
    capability: keyof MarketDataProvider["capabilities"],
  ): void {
    if (!provider.capabilities[capability]) {
      throw new MarketDataError(
        "unsupported_capability",
        `Market data provider "${provider.id}" does not support "${capability}".`,
        {
          providerId: provider.id,
        },
      );
    }
  }

  private shouldFallback(
    error: unknown,
  ): boolean {
    if (
      !(error instanceof MarketDataError)
    ) {
      return true;
    }

    return (
      error.code ===
        "provider_unavailable" ||
      error.code ===
        "rate_limited" ||
      error.code ===
        "provider_error"
    );
  }

  private findFallbackProvider(
    provider: MarketDataProvider,
    capability?: keyof MarketDataProvider["capabilities"],
  ): MarketDataProvider | null {
    return (
      this.registry
        .list()
        .find(
          (candidate) =>
            candidate.id !==
              provider.id &&
            (!capability ||
              candidate.capabilities[
                capability
              ]),
        ) ?? null
    );
  }

  private async withFallback<T>(
    operation: (
      provider: MarketDataProvider,
    ) => Promise<T>,
    providerId?: string,
    capability?: keyof MarketDataProvider["capabilities"],
  ): Promise<T> {
    const provider =
      this.getProvider(providerId);

    if (
      capability &&
      !provider.capabilities[
        capability
      ]
    ) {
      if (!this.allowFallback) {
        this.requireCapability(
          provider,
          capability,
        );
      }

      const fallbackProvider =
        this.findFallbackProvider(
          provider,
          capability,
        );

      if (!fallbackProvider) {
        throw new MarketDataError(
          "unsupported_capability",
          `No registered market data provider supports "${capability}".`,
          {
            providerId:
              provider.id,
          },
        );
      }

      return operation(
        fallbackProvider,
      );
    }

    try {
      return await operation(
        provider,
      );
    } catch (error) {
      if (
        !this.allowFallback ||
        !this.shouldFallback(error)
      ) {
        throw error;
      }

      const fallbackProvider =
        this.findFallbackProvider(
          provider,
          capability,
        );

      if (!fallbackProvider) {
        throw error;
      }

      console.warn(
        `Market data provider "${provider.id}" failed. Falling back to "${fallbackProvider.id}".`,
        error,
      );

      return operation(
        fallbackProvider,
      );
    }
  }

  async searchInstruments(
    query: string,
    providerId?: string,
  ): Promise<InstrumentSearchResult[]> {
    const results =
      await this.withFallback(
        (provider) => {
          this.requireCapability(
            provider,
            "searchInstruments",
          );

          return provider.searchInstruments(
            query,
          );
        },
        providerId,
        "searchInstruments",
      );

    return results.map(
      (result) => {
        const instrument = {
          ...result.instrument,
          symbol: normalizeSymbol(
            result.instrument.symbol,
          ),
        };

        this.instrumentRegistry.upsert(
          instrument,
        );

        return {
          ...result,
          instrument,
        };
      },
    );
  }

  async getInstrument(
    symbol: string,
    providerId?: string,
  ): Promise<Instrument | null> {
    const instrument =
      await this.withFallback(
        (provider) => {
          this.requireCapability(
            provider,
            "instrumentDetails",
          );

          return provider.getInstrument(
            symbol,
          );
        },
        providerId,
        "instrumentDetails",
      );

    if (!instrument) {
      return null;
    }

    const normalizedInstrument = {
      ...instrument,
      symbol: normalizeSymbol(
        instrument.symbol,
      ),
    };

    this.instrumentRegistry.upsert(
      normalizedInstrument,
    );

    return normalizedInstrument;
  }

  async getQuote(
    symbol: string,
    providerId?: string,
  ): Promise<Quote | null> {
    return this.withFallback(
      (provider) => {
        this.requireCapability(
          provider,
          "quotes",
        );

        return provider.getQuote(
          symbol,
        );
      },
      providerId,
      "quotes",
    );
  }

  async getHistoricalPrices(
    request: HistoricalPriceRequest,
    providerId?: string,
  ): Promise<OHLCVBar[]> {
    return this.withFallback(
      (provider) => {
        this.requireCapability(
          provider,
          "historicalPrices",
        );

        return provider.getHistoricalPrices(
          request,
        );
      },
      providerId,
      "historicalPrices",
    );
  }

  async listExchanges(
    providerId?: string,
  ): Promise<Exchange[]> {
    return this.withFallback(
      (provider) => {
        this.requireCapability(
          provider,
          "exchanges",
        );

        return provider.listExchanges();
      },
      providerId,
      "exchanges",
    );
  }
}
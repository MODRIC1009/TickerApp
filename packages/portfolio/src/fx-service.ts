import {
  convertCurrency,
  normalizeCurrency,
  type FxRate,
  type FxRateProvider,
} from "./currency";
import { FxProviderRegistry } from "./fx-provider-registry";

export interface FxConversionResult {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  asOf: string;
  providerId: string;
}

export interface FxServiceOptions {
  providers?: Record<string, FxRateProvider>;
  defaultProviderId?: string;
  fallbackProviderIds?: string[];
}

export class FxService {
  private readonly registry: FxProviderRegistry;
  private readonly defaultProviderId?: string;
  private readonly fallbackProviderIds: string[];

  constructor(options: FxServiceOptions = {}) {
    this.registry = new FxProviderRegistry();

    this.defaultProviderId =
      options.defaultProviderId?.trim().toLowerCase() ||
      undefined;

    this.fallbackProviderIds = (
      options.fallbackProviderIds ?? []
    )
      .map((id) => id.trim().toLowerCase())
      .filter(Boolean);

    for (const [id, provider] of Object.entries(
      options.providers ?? {},
    )) {
      this.registry.register(id, provider);
    }
  }

  registerProvider(
    id: string,
    provider: FxRateProvider,
  ): void {
    this.registry.register(id, provider);
  }

  async getRate(
    fromCurrency: string,
    toCurrency: string,
    providerId?: string,
  ): Promise<FxRate> {
    const normalizedFrom = normalizeCurrency(fromCurrency);
    const normalizedTo = normalizeCurrency(toCurrency);

    const providerIds = this.resolveProviderIds(providerId);

    let lastError: unknown;

    for (const id of providerIds) {
      try {
        const provider = this.registry.get(id);

        return await provider.getRate(
          normalizedFrom,
          normalizedTo,
        );
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError instanceof Error) {
      throw lastError;
    }

    throw new Error(
      "No FX provider is available for the requested operation.",
    );
  }

  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    providerId?: string,
  ): Promise<FxConversionResult> {
    const normalizedFrom = normalizeCurrency(fromCurrency);
    const normalizedTo = normalizeCurrency(toCurrency);

    const resolvedProviderId =
      providerId?.trim().toLowerCase() ??
      this.defaultProviderId;

    if (normalizedFrom === normalizedTo) {
      return {
        amount,
        fromCurrency: normalizedFrom,
        toCurrency: normalizedTo,
        rate: 1,
        asOf: new Date().toISOString(),
        providerId: resolvedProviderId ?? "identity",
      };
    }

    const providerIds = this.resolveProviderIds(providerId);

    let lastError: unknown;

    for (const id of providerIds) {
      try {
        const provider = this.registry.get(id);

        const rate = await provider.getRate(
          normalizedFrom,
          normalizedTo,
        );

        return {
          amount: convertCurrency(
            amount,
            normalizedFrom,
            normalizedTo,
            rate.rate,
          ),
          fromCurrency: normalizedFrom,
          toCurrency: normalizedTo,
          rate: rate.rate,
          asOf: rate.asOf,
          providerId: id,
        };
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError instanceof Error) {
      throw lastError;
    }

    throw new Error(
      "No FX provider is available for the requested operation.",
    );
  }

  listProviders(): string[] {
    return this.registry.list().map(
      (registration) => registration.id,
    );
  }

  private resolveProviderIds(
    providerId?: string,
  ): string[] {
    const requestedProviderId =
      providerId?.trim().toLowerCase();

    if (requestedProviderId) {
      return [
        requestedProviderId,
        ...this.fallbackProviderIds.filter(
          (id) => id !== requestedProviderId,
        ),
      ];
    }

    if (this.defaultProviderId) {
      return [
        this.defaultProviderId,
        ...this.fallbackProviderIds.filter(
          (id) => id !== this.defaultProviderId,
        ),
      ];
    }

    if (this.fallbackProviderIds.length > 0) {
      return [...this.fallbackProviderIds];
    }

    throw new Error(
      "No FX provider was specified and no default FX provider is configured.",
    );
  }
}
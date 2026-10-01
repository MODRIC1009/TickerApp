import type { FxRateProvider } from "./currency";

export interface FxProviderRegistration {
  id: string;
  provider: FxRateProvider;
}

export class FxProviderRegistry {
  private readonly providers = new Map<
    string,
    FxRateProvider
  >();

  register(
    id: string,
    provider: FxRateProvider,
  ): void {
    const normalizedId = id.trim().toLowerCase();

    if (!normalizedId) {
      throw new Error("FX provider id is required.");
    }

    if (this.providers.has(normalizedId)) {
      throw new Error(
        `FX provider "${normalizedId}" is already registered.`,
      );
    }

    this.providers.set(normalizedId, provider);
  }

  get(id: string): FxRateProvider {
    const normalizedId = id.trim().toLowerCase();
    const provider = this.providers.get(normalizedId);

    if (!provider) {
      throw new Error(
        `FX provider "${normalizedId}" is not registered.`,
      );
    }

    return provider;
  }

  has(id: string): boolean {
    return this.providers.has(
      id.trim().toLowerCase(),
    );
  }

  list(): FxProviderRegistration[] {
    return Array.from(this.providers.entries()).map(
      ([id, provider]) => ({
        id,
        provider,
      }),
    );
  }

  clear(): void {
    this.providers.clear();
  }
}
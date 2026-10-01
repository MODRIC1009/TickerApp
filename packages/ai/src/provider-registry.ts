import type { AIResearchProvider } from "./types";

export class AIProviderRegistry {
  private readonly providers =
    new Map<string, AIResearchProvider>();

  register(
    provider: AIResearchProvider,
  ): void {
    const providerId =
      provider.id.trim();

    if (!providerId) {
      throw new Error(
        "AI provider ID cannot be empty.",
      );
    }

    if (this.providers.has(providerId)) {
      throw new Error(
        `AI provider "${providerId}" is already registered.`,
      );
    }

    this.providers.set(
      providerId,
      provider,
    );
  }

  get(
    providerId: string,
  ): AIResearchProvider {
    const normalizedProviderId =
      providerId.trim();

    const provider =
      this.providers.get(
        normalizedProviderId,
      );

    if (!provider) {
      throw new Error(
        `AI provider "${normalizedProviderId}" is not registered.`,
      );
    }

    return provider;
  }

  has(
    providerId: string,
  ): boolean {
    return this.providers.has(
      providerId.trim(),
    );
  }

  list(): AIResearchProvider[] {
    return [
      ...this.providers.values(),
    ];
  }

  getFallbackProvider(
    excludeProviderId: string,
  ): AIResearchProvider | null {
    const normalizedProviderId =
      excludeProviderId.trim();

    return (
      this.list().find(
        (provider) =>
          provider.id !==
          normalizedProviderId,
      ) ?? null
    );
  }
}

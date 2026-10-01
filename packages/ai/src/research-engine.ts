import type {
  AIResearchProvider,
  AIProviderHealth,
  ResearchInput,
  ResearchResult,
} from "./types";

import { AIError } from "./errors";
import { AIProviderRegistry } from "./provider-registry";
import {
  buildResearchPrompt,
} from "./prompts/research-prompt";

export interface AIProviderSummary {
  id: string;
  name: string;
  model: string;
  capabilities: AIResearchProvider["capabilities"];
}

export class ResearchEngine {
  constructor(
    private readonly registry: AIProviderRegistry,
    private readonly defaultProviderId: string,
  ) {}

  getDefaultProvider(): AIResearchProvider {
    return this.getProvider();
  }

  getProviders(): AIResearchProvider[] {
    return this.registry.list();
  }

  getProviderSummaries(): AIProviderSummary[] {
    return this.getProviders().map(
      (provider) => ({
        id: provider.id,
        name: provider.name,
        model: provider.model,
        capabilities:
          provider.capabilities,
      }),
    );
  }

  async getProviderHealth(
    providerId?: string,
  ): Promise<AIProviderHealth> {
    return this.getProvider(
      providerId,
    ).healthCheck();
  }

  async getHealth(): Promise<{
    status: AIProviderHealth["status"];
    checkedAt: string;
    providers: Array<
      AIProviderHealth & {
        providerId: string;
        providerName: string;
        model: string;
      }
    >;
  }> {
    const providers =
      await Promise.all(
        this.registry.list().map(
          async (provider) => {
            const health =
              await provider.healthCheck();

            return {
              ...health,
              providerId:
                provider.id,
              providerName:
                provider.name,
              model: provider.model,
            };
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

  async research(
  input: ResearchInput,
  providerId?: string,
): Promise<ResearchResult> {
  this.validateInput(input);

  const execution =
    await this.withFallback(
      (provider) => {
        this.requireResearchCapability(
          provider,
        );

        return provider.research({
  input,
  prompt:
    buildResearchPrompt(
      input,
    ),
});
      },
      providerId,
    );

  this.validateResult(
    execution.result,
    input,
  );

  return {
    ...execution.result,
    providerId:
      execution.provider.id,
    model:
      execution.provider.model,
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
      throw new AIError(
        "invalid_request",
        `Unknown AI provider "${resolvedProviderId}".`,
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
  ): AIResearchProvider {
    return this.registry.get(
      this.resolveProviderId(
        providerId,
      ),
    );
  }

  private requireResearchCapability(
    provider: AIResearchProvider,
  ): void {
    if (
      !provider.capabilities.research
    ) {
      throw new AIError(
        "unsupported_capability",
        `AI provider "${provider.id}" does not support research.`,
        {
          providerId: provider.id,
        },
      );
    }
  }

  private shouldFallback(
    error: unknown,
  ): boolean {
    if (!(error instanceof AIError)) {
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

  private async withFallback<T>(
  operation: (
    provider: AIResearchProvider,
  ) => Promise<T>,
  providerId?: string,
): Promise<{
  result: T;
  provider: AIResearchProvider;
}> {
  const provider =
    this.getProvider(providerId);

  if (!provider.capabilities.research) {
    const fallback =
      this.registry.list().find(
        (candidate) =>
          candidate.id !== provider.id &&
          candidate.capabilities.research,
      ) ?? null;

    if (!fallback) {
      this.requireResearchCapability(
        provider,
      );
    }

    return {
  result: await operation(
    fallback!,
  ),
  provider: fallback!,
};
  }

  try {
    return {
  result: await operation(
    provider,
  ),
  provider,
};
  } catch (error) {
    if (
      !this.shouldFallback(error)
    ) {
      throw error;
    }

    const fallback =
      this.registry.list().find(
        (candidate) =>
          candidate.id !== provider.id &&
          candidate.capabilities.research,
      ) ?? null;

    if (!fallback) {
      throw error;
    }

    return {
  result: await operation(
    fallback,
  ),
  provider: fallback,
};
  }
}

  private validateInput(
    input: ResearchInput,
  ): void {
    if (
      !input.instrument.symbol.trim()
    ) {
      throw new AIError(
        "invalid_request",
        "Research instrument symbol cannot be empty.",
      );
    }

    if (
      !input.instrument.name.trim()
    ) {
      throw new AIError(
        "invalid_request",
        "Research instrument name cannot be empty.",
      );
    }

    if (
      input.question !==
        undefined &&
      !input.question.trim()
    ) {
      throw new AIError(
        "invalid_request",
        "Research question cannot be empty when provided.",
      );
    }
  }

  private validateResult(
    result: ResearchResult,
    input: ResearchInput,
  ): void {
    if (
      result.instrument.symbol.trim().toUpperCase() !==
      input.instrument.symbol
        .trim()
        .toUpperCase()
    ) {
      throw new AIError(
        "provider_error",
        "AI provider returned a result for a different instrument.",
      );
    }

    if (
      !result.thesis.trim()
    ) {
      throw new AIError(
        "provider_error",
        "AI provider returned an empty research thesis.",
      );
    }
  }
}

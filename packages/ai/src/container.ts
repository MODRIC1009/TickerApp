import {
  DemoAIProvider,
} from "./providers/demo-ai-provider";

import {
  AIProviderRegistry,
} from "./provider-registry";

import {
  ResearchEngine,
} from "./research-engine";

import type {
  AIResearchProvider,
} from "./types";

export interface AIContainer {
  registry: AIProviderRegistry;
  researchEngine: ResearchEngine;
}

export interface AIContainerConfig {
  defaultProviderId?: string;
  providers?: AIResearchProvider[];
}

export function createAIContainer(
  config: AIContainerConfig = {},
): AIContainer {
  const registry =
    new AIProviderRegistry();

  registry.register(
    new DemoAIProvider(),
  );

  for (
    const provider of
    config.providers ?? []
  ) {
    if (
      provider.id ===
      "demo-ai"
    ) {
      throw new Error(
        'The "demo-ai" provider is registered automatically.',
      );
    }

    registry.register(
      provider,
    );
  }

  const defaultProviderId =
    config.defaultProviderId?.trim() ||
    "demo-ai";

  if (
    !registry.has(
      defaultProviderId,
    )
  ) {
    throw new Error(
      `Configured AI provider "${defaultProviderId}" is not registered.`,
    );
  }

  return {
    registry,
    researchEngine:
      new ResearchEngine(
        registry,
        defaultProviderId,
      ),
  };
}
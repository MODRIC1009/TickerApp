import { AIError } from "../errors";
import {
  parseResearchResult,
} from "../research-parser";
import type {
  AIProviderHealth,
  AIResearchProvider,
  AIResearchRequest,
  ResearchResult,
} from "../types";

export interface OpenAICompatibleProviderConfig {
  id: string;
  name: string;
  model: string;
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export class OpenAICompatibleProvider
  implements AIResearchProvider
{
  readonly capabilities = {
    research: true,
  } as const;

  constructor(
    private readonly config: OpenAICompatibleProviderConfig,
  ) {}

  get id(): string {
    return this.config.id;
  }

  get name(): string {
    return this.config.name;
  }

  get model(): string {
    return this.config.model;
  }

  async research(
    request: AIResearchRequest,
  ): Promise<ResearchResult> {
    if (!this.config.apiKey.trim()) {
      throw new AIError(
        "provider_unavailable",
        `AI provider "${this.id}" is not configured with an API key.`,
        {
          providerId: this.id,
        },
      );
    }

    const timeoutMs =
  this.config.timeoutMs ?? 30_000;

const controller =
  new AbortController();

const timeout =
  setTimeout(
    () => controller.abort(),
    timeoutMs,
  );

    let response: Response;

    try {
      response = await fetch(
  `${this.config.baseUrl.replace(/\/$/, "")}/chat/completions`,
  {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization:
        `Bearer ${this.config.apiKey}`,
    },
    body: JSON.stringify({
      model: this.model,
      messages: [
        {
          role: "user",
          content: request.prompt,
        },
      ],
    }),
    signal: controller.signal,
  },
);
    } catch (error) {
  throw new AIError(
        "provider_unavailable",
        `AI provider "${this.id}" could not be reached.`,
        {
          providerId: this.id,
          cause: error,
        },
      );
    } finally {
  clearTimeout(timeout);
}

    if (response.status === 429) {
      throw new AIError(
        "rate_limited",
        `AI provider "${this.id}" is rate limited.`,
        {
          providerId: this.id,
        },
      );
    }

    if (!response.ok) {
      throw new AIError(
        "provider_error",
        `AI provider "${this.id}" returned HTTP ${response.status}.`,
        {
          providerId: this.id,
          details: {
            status: response.status,
          },
        },
      );
    }

    const payload =
      (await response.json()) as ChatCompletionResponse;

    const content =
      payload.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new AIError(
        "provider_error",
        `AI provider "${this.id}" returned an empty response.`,
        {
          providerId: this.id,
        },
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw new AIError(
        "provider_error",
        `AI provider "${this.id}" returned invalid JSON.`,
        {
          providerId: this.id,
          cause: error,
        },
      );
    }

    return parseResearchResult(
      parsed,
      request.input,
      this.id,
      this.model,
    );
  }

  async healthCheck(): Promise<AIProviderHealth> {
    if (!this.config.apiKey.trim()) {
      return {
        status: "unavailable",
        checkedAt:
          new Date().toISOString(),
        message:
          "Provider API key is not configured.",
      };
    }

    return {
      status: "healthy",
      checkedAt:
        new Date().toISOString(),
      message:
        "Provider configuration is present.",
    };
  }
}
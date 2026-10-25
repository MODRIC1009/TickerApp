
import { AIError } from "../errors";
import { parseResearchResult } from "../research-parser";
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
      content?: string | null;
    };
    finish_reason?: string | null;
  }>;
}

export class OpenAICompatibleProvider implements AIResearchProvider {
  readonly capabilities = { research: true } as const;

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

  async research(request: AIResearchRequest): Promise<ResearchResult> {
    if (!this.config.apiKey.trim()) {
      throw new AIError(
        "provider_unavailable",
        `AI provider "${this.id}" is not configured with an API key.`,
        { providerId: this.id },
      );
    }

    try {
      return await this.requestAndParse(request, request.prompt, 1);
    } catch (error) {
      if (!this.isRepairableOutputError(error)) {
        throw error;
      }

      const repairPrompt = [
        request.prompt,
        "",
        "Your previous response failed the required JSON schema.",
        "Return one complete corrected JSON object. Return valid JSON only.",
        "Required fields: thesis, bullCase, bearCase, catalysts, risks, sections, evidence, confidence, limitations.",
        "thesis must be a non-empty string.",
        "bullCase, bearCase, catalysts, risks, and limitations must each be non-empty string arrays.",
        "sections must contain at least one object with non-empty title, summary, and keyPoints string array.",
        "evidence must be an array. Use [] if no evidence was supplied; never invent sources.",
        'confidence must be exactly "high", "medium", or "low".',
      ].join("\n");

      return this.requestAndParse(request, repairPrompt, 2);
    }
  }

  private isRepairableOutputError(error: unknown): boolean {
    if (!(error instanceof AIError) || error.code !== "provider_error") {
      return false;
    }

    const message = error.message.toLowerCase();

    return (
      message.includes("research output") ||
      message.includes("research section") ||
      message.includes("research evidence") ||
      message.includes("confidence") ||
      message.includes("invalid json")
    );
  }

  private async requestAndParse(
    request: AIResearchRequest,
    prompt: string,
    attempt: number,
  ): Promise<ResearchResult> {
    const timeoutMs = this.config.timeoutMs ?? 90_000;
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const requestBody = {
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      ...(this.id === "ollama"
        ? {
            stream: false,
            response_format: { type: "json_object" as const },
            max_tokens: 1200,
            options: { num_thread: 4 },
          }
        : {}),
    };

    let response: Response;

    try {
      response = await fetch(
        `${this.config.baseUrl.replace(/\/$/, "")}/chat/completions`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        },
      );
    } catch (error) {
      const timedOut =
        error instanceof Error && error.name === "AbortError";

      this.logAttempt(attempt, startedAt, "request_failed");

      throw new AIError(
        "provider_unavailable",
        timedOut
          ? `AI provider "${this.id}" timed out after ${timeoutMs} ms.`
          : `AI provider "${this.id}" could not be reached.`,
        { providerId: this.id, cause: error },
      );
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 429) {
      this.logAttempt(attempt, startedAt, "rate_limited");

      throw new AIError(
        "rate_limited",
        `AI provider "${this.id}" is rate limited.`,
        { providerId: this.id },
      );
    }

    if (!response.ok) {
      this.logAttempt(attempt, startedAt, `http_${response.status}`);

      throw new AIError(
        "provider_error",
        `AI provider "${this.id}" returned HTTP ${response.status}.`,
        {
          providerId: this.id,
          details: { status: response.status },
        },
      );
    }

    let payload: ChatCompletionResponse;

    try {
      payload = (await response.json()) as ChatCompletionResponse;
    } catch (error) {
      this.logAttempt(attempt, startedAt, "invalid_api_response");

      throw new AIError(
        "provider_error",
        `AI provider "${this.id}" returned an invalid API response.`,
        { providerId: this.id, cause: error },
      );
    }

    const content = payload.choices?.[0]?.message?.content?.trim();

    if (!content) {
      this.logAttempt(attempt, startedAt, "empty_response");

      throw new AIError(
        "provider_error",
        `AI provider "${this.id}" returned an empty response.`,
        { providerId: this.id },
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch (error) {
      this.logAttempt(attempt, startedAt, "invalid_json");

      throw new AIError(
        "provider_error",
        `AI provider "${this.id}" returned invalid JSON.`,
        { providerId: this.id, cause: error },
      );
    }

    try {
      const result = parseResearchResult(
        parsed,
        request.input,
        this.id,
        this.model,
      );

      this.logAttempt(
        attempt,
        startedAt,
        payload.choices?.[0]?.finish_reason === "length"
          ? "valid_json_generation_limit_reached"
          : "success",
      );

      return result;
    } catch (error) {
      this.logAttempt(attempt, startedAt, "schema_validation_failed");
      throw error;
    }
  }

  private logAttempt(
    attempt: number,
    startedAt: number,
    outcome: string,
  ): void {
    if (this.id !== "ollama") {
      return;
    }

    console.info(
      `[ai-research-timing] provider=${this.id} model=${this.model} attempt=${attempt} durationMs=${Date.now() - startedAt} outcome=${outcome}`,
    );
  }

  async healthCheck(): Promise<AIProviderHealth> {
    if (!this.config.apiKey.trim()) {
      return {
        status: "unavailable",
        checkedAt: new Date().toISOString(),
        message: "Provider API key is not configured.",
      };
    }

    return {
      status: "healthy",
      checkedAt: new Date().toISOString(),
      message: "Provider configuration is present.",
    };
  }
}

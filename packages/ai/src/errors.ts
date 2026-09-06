export type AIErrorCode =
  | "invalid_request"
  | "unsupported_capability"
  | "provider_unavailable"
  | "rate_limited"
  | "provider_error";

export class AIError extends Error {
  readonly code: AIErrorCode;
  readonly providerId?: string;
  readonly details?: Record<string, unknown>;

  constructor(
    code: AIErrorCode,
    message: string,
    options?: {
      providerId?: string;
      details?: Record<string, unknown>;
      cause?: unknown;
    },
  ) {
    super(message, {
      cause: options?.cause,
    });

    this.name = "AIError";
    this.code = code;
    this.providerId =
      options?.providerId;
    this.details =
      options?.details;
  }
}

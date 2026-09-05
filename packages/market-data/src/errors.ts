export type MarketDataErrorCode =
  | "invalid_request"
  | "not_found"
  | "provider_unavailable"
  | "rate_limited"
  | "unsupported_capability"
  | "provider_error";

export class MarketDataError extends Error {
  readonly code: MarketDataErrorCode;
  readonly providerId?: string;

  constructor(
    code: MarketDataErrorCode,
    message: string,
    options?: {
      providerId?: string;
      cause?: unknown;
    },
  ) {
    super(message, {
      cause: options?.cause,
    });

    this.name = "MarketDataError";
    this.code = code;
    this.providerId = options?.providerId;
  }
}
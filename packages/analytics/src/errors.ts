export type AnalyticsErrorCode =
  | "invalid_request"
  | "insufficient_data"
  | "invalid_price"
  | "invalid_parameter"
  | "backtest_error";

export class AnalyticsError extends Error {
  readonly code: AnalyticsErrorCode;

  constructor(
    code: AnalyticsErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AnalyticsError";
    this.code = code;
  }
}
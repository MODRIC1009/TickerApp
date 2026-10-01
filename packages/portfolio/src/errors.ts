export type PortfolioErrorCode =
  | "invalid_request"
  | "portfolio_not_found"
  | "position_not_found"
  | "insufficient_cash"
  | "insufficient_quantity"
  | "invalid_transaction";

export class PortfolioError extends Error {
  readonly code: PortfolioErrorCode;

  constructor(code: PortfolioErrorCode, message: string) {
    super(message);
    this.name = "PortfolioError";
    this.code = code;
  }
}
import { PortfolioError } from "./errors";
import type { Portfolio, Transaction } from "./types";

function assertFiniteNumber(value: number, field: string): void {
  if (!Number.isFinite(value)) {
    throw new PortfolioError(
      "invalid_request",
      `${field} must be a finite number.`,
    );
  }
}

function assertPositiveNumber(value: number, field: string): void {
  assertFiniteNumber(value, field);

  if (value <= 0) {
    throw new PortfolioError(
      "invalid_request",
      `${field} must be greater than zero.`,
    );
  }
}

export function validatePortfolio(portfolio: Portfolio): void {
  if (!portfolio.id.trim()) {
    throw new PortfolioError(
      "invalid_request",
      "Portfolio id is required.",
    );
  }

  if (!portfolio.name.trim()) {
    throw new PortfolioError(
      "invalid_request",
      "Portfolio name is required.",
    );
  }

  if (!portfolio.baseCurrency.trim()) {
    throw new PortfolioError(
      "invalid_request",
      "Portfolio base currency is required.",
    );
  }

  assertFiniteNumber(portfolio.cashBalance, "cashBalance");

  if (portfolio.cashBalance < 0) {
    throw new PortfolioError(
      "invalid_request",
      "cashBalance cannot be negative.",
    );
  }

  if (!portfolio.createdAt.trim() || !portfolio.updatedAt.trim()) {
    throw new PortfolioError(
      "invalid_request",
      "Portfolio timestamps are required.",
    );
  }
}

export function validateTransaction(transaction: Transaction): void {
  if (!transaction.id.trim()) {
    throw new PortfolioError(
      "invalid_transaction",
      "Transaction id is required.",
    );
  }

  if (!transaction.portfolioId.trim()) {
    throw new PortfolioError(
      "invalid_transaction",
      "Transaction portfolio id is required.",
    );
  }

  if (!transaction.symbol.trim()) {
    throw new PortfolioError(
      "invalid_transaction",
      "Transaction symbol is required.",
    );
  }

  if (transaction.side !== "buy" && transaction.side !== "sell") {
    throw new PortfolioError(
      "invalid_transaction",
      "Transaction side must be buy or sell.",
    );
  }

  assertPositiveNumber(transaction.quantity, "quantity");
  assertPositiveNumber(transaction.price, "price");

  assertFiniteNumber(transaction.fees, "fees");

  if (transaction.fees < 0) {
    throw new PortfolioError(
      "invalid_transaction",
      "fees cannot be negative.",
    );
  }

  if (!transaction.executedAt.trim()) {
    throw new PortfolioError(
      "invalid_transaction",
      "Transaction execution time is required.",
    );
  }
}
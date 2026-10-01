import type {
  Portfolio,
  PortfolioValuation,
  Position,
  Transaction,
} from "@tickerapp/portfolio";
import type { Instrument } from "@tickerapp/shared";

export interface CreatePortfolioRequest {
  id: string;
  name: string;
  baseCurrency: string;
  cashBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionRequest {
  id: string;
  portfolioId: string;
  symbol: string;
  instrument: Instrument;
  side: Transaction["side"];
  quantity: number;
  price: number;
  fees: number;
  executedAt: string;
}

export interface PortfolioResponse {
  portfolio: Portfolio;
}

export interface PortfolioListResponse {
  portfolios: Portfolio[];
}

export interface PortfolioTransactionsResponse {
  transactions: Transaction[];
}

export interface PortfolioPositionsResponse {
  positions: Position[];
}

export interface PortfolioValuationResponse {
  valuation: PortfolioValuation;
}

export async function createPortfolio(
  request: CreatePortfolioRequest,
): Promise<PortfolioResponse> {
  const response = await fetch("/api/portfolio", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const payload = (await response.json()) as
    | PortfolioResponse
    | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in payload && payload.error
        ? payload.error
        : "Failed to create portfolio.",
    );
  }

  return payload as PortfolioResponse;
}

export async function getPortfolios(): Promise<PortfolioListResponse> {
  const response = await fetch("/api/portfolio");

  const payload = (await response.json()) as
    | PortfolioListResponse
    | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in payload && payload.error
        ? payload.error
        : "Failed to fetch portfolios.",
    );
  }

  return payload as PortfolioListResponse;
}

export async function createTransaction(
  request: CreateTransactionRequest,
): Promise<{ transaction: Transaction }> {
  const response = await fetch("/api/portfolio/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const payload = (await response.json()) as
    | { transaction: Transaction }
    | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in payload && payload.error
        ? payload.error
        : "Failed to create transaction.",
    );
  }

  return payload as { transaction: Transaction };
}

export async function getPortfolioTransactions(
  portfolioId: string,
): Promise<PortfolioTransactionsResponse> {
  const response = await fetch(
    `/api/portfolio/transactions?portfolioId=${encodeURIComponent(
      portfolioId,
    )}`,
  );

  const payload = (await response.json()) as
    | PortfolioTransactionsResponse
    | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in payload && payload.error
        ? payload.error
        : "Failed to fetch portfolio transactions.",
    );
  }

  return payload as PortfolioTransactionsResponse;
}

export async function getPortfolioPositions(
  portfolioId: string,
): Promise<PortfolioPositionsResponse> {
  const response = await fetch(
    `/api/portfolio/${encodeURIComponent(portfolioId)}/positions`,
  );

  const payload = (await response.json()) as
    | PortfolioPositionsResponse
    | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in payload && payload.error
        ? payload.error
        : "Failed to fetch portfolio positions.",
    );
  }

  return payload as PortfolioPositionsResponse;
}

export async function getPortfolioValuation(
  portfolioId: string,
): Promise<PortfolioValuationResponse> {
  const response = await fetch(
    `/api/portfolio/${encodeURIComponent(portfolioId)}/valuation`,
  );

  const payload = (await response.json()) as
    | PortfolioValuationResponse
    | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in payload && payload.error
        ? payload.error
        : "Failed to fetch portfolio valuation.",
    );
  }

  return payload as PortfolioValuationResponse;
}
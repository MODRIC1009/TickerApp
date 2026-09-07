import type { Instrument } from "@tickerapp/shared";

export type PortfolioId = string;
export type TransactionSide = "buy" | "sell";

export interface Portfolio {
  id: PortfolioId;
  name: string;
  baseCurrency: string;
  cashBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  portfolioId: string;
  instrument: Instrument;
  quantity: number;
  averageCost: number;
  costBasis: number;
  marketPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  portfolioId: string;
  symbol: string;
  instrument: Instrument;
  side: TransactionSide;
  quantity: number;
  price: number;
  fees: number;
  executedAt: string;
}

export interface RealizedPnl {
  portfolioId: string;
  symbol: string;
  currency: string;
  realizedPnl: number;
  realizedPnlPercent: number;
}

export interface PortfolioValuation {
  portfolioId: string;
  baseCurrency: string;
  cashValue: number;
  positionsValue: number;
  totalValue: number;
  totalCostBasis: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalPnl: number;
  totalPnlPercent: number;
  asOf: string;
}
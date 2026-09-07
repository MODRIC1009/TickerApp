import { normalizeCurrency } from "./currency";
import type {
  PortfolioValuation,
  Position,
} from "./types";

export interface ValuationPosition {
  position: Position;
  currency: string;
  convertedMarketValue: number;
  convertedCostBasis: number;
  convertedUnrealizedPnl: number;
  fxRate: number;
  fxAsOf: string;
  fxProviderId: string;
}

export function calculateCurrencyAwareValuation(
  portfolioId: string,
  baseCurrency: string,
  cashValue: number,
  positions: ValuationPosition[],
  realizedPnl: number,
  asOf: string,
): PortfolioValuation {
  const normalizedBaseCurrency =
    normalizeCurrency(baseCurrency);

  const positionsValue = positions.reduce(
    (total, position) =>
      total + position.convertedMarketValue,
    0,
  );

  const totalCostBasis = positions.reduce(
    (total, position) =>
      total + position.convertedCostBasis,
    0,
  );

  const unrealizedPnl = positions.reduce(
    (total, position) =>
      total + position.convertedUnrealizedPnl,
    0,
  );

  const totalValue =
    cashValue + positionsValue;

  const totalPnl =
    unrealizedPnl + realizedPnl;

  const totalPnlPercent =
    totalCostBasis === 0
      ? 0
      : (totalPnl / totalCostBasis) * 100;

  return {
    portfolioId,
    baseCurrency: normalizedBaseCurrency,
    cashValue,
    positionsValue,
    totalValue,
    totalCostBasis,
    unrealizedPnl,
    realizedPnl,
    totalPnl,
    totalPnlPercent,
    asOf,
  };
}
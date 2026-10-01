import { PortfolioError } from "./errors";
import { calculatePosition } from "./calculations";
import { getInstrumentIdentity } from "./identity";
import type { Instrument } from "@tickerapp/shared";
import type {
  Position,
  Transaction,
} from "./types";

export function buildPosition(
  portfolioId: string,
  symbol: string,
  transactions: Transaction[],
  marketPrice: number,
  updatedAt: string,
): Position | undefined {
  const relevantTransactions = transactions
    .filter(
      (transaction) =>
        transaction.portfolioId === portfolioId &&
        transaction.symbol === symbol,
    )
    .sort(
      (a, b) =>
        new Date(a.executedAt).getTime() -
          new Date(b.executedAt).getTime() ||
        a.id.localeCompare(b.id),
    );

  if (relevantTransactions.length === 0) {
    return undefined;
  }

  const instrumentIdentity = getInstrumentIdentity(
    relevantTransactions[0].instrument,
  );

  const identityTransactions = relevantTransactions.filter(
    (transaction) =>
      getInstrumentIdentity(transaction.instrument) ===
      instrumentIdentity,
  );

  if (identityTransactions.length === 0) {
    return undefined;
  }

  const instrument: Instrument =
    identityTransactions[0].instrument;

  let quantity = 0;
  let averageCost = 0;

  for (const transaction of identityTransactions) {
    if (transaction.side === "buy") {
      const existingCostBasis = quantity * averageCost;
      const transactionCost =
        transaction.quantity * transaction.price +
        transaction.fees;

      const newQuantity = quantity + transaction.quantity;

      averageCost =
        newQuantity === 0
          ? 0
          : (existingCostBasis + transactionCost) /
            newQuantity;

      quantity = newQuantity;
      continue;
    }

    if (transaction.quantity > quantity) {
      throw new PortfolioError(
        "insufficient_quantity",
        `Insufficient quantity of "${transaction.symbol}" for transaction "${transaction.id}".`,
      );
    }

    quantity -= transaction.quantity;

    if (quantity === 0) {
      averageCost = 0;
    }
  }

  if (quantity === 0) {
    return undefined;
  }

  const position: Position = {
    portfolioId,
    instrument,
    quantity,
    averageCost,
    costBasis: 0,
    marketPrice,
    marketValue: 0,
    unrealizedPnl: 0,
    unrealizedPnlPercent: 0,
    updatedAt,
  };

  return {
    ...position,
    ...calculatePosition(position),
  };
}
import { PortfolioError } from "./errors";
import { getInstrumentIdentity } from "./identity";
import type {
  PortfolioValuation,
  Position,
  RealizedPnl,
  Transaction,
} from "./types";

function roundFinancialValue(
  value: number,
  precision = 10,
): number {
  if (!Number.isFinite(value)) {
    return value;
  }

  const factor = 10 ** precision;

  return Math.round((value + Number.EPSILON) * factor) /
    factor;
}

export function calculatePosition(
  position: Position,
): Pick<
  Position,
  | "costBasis"
  | "marketValue"
  | "unrealizedPnl"
  | "unrealizedPnlPercent"
> {
  const costBasis = roundFinancialValue(
    position.quantity * position.averageCost,
  );

  const marketValue = roundFinancialValue(
    position.quantity * position.marketPrice,
  );

  const unrealizedPnl = roundFinancialValue(
    marketValue - costBasis,
  );

  const unrealizedPnlPercent =
    costBasis === 0
      ? 0
      : roundFinancialValue(
          (unrealizedPnl / costBasis) * 100,
        );

  return {
    costBasis,
    marketValue,
    unrealizedPnl,
    unrealizedPnlPercent,
  };
}

export function calculateRealizedPnl(
  transactions: Transaction[],
): RealizedPnl[] {
  const grouped = new Map<
    string,
    {
      portfolioId: string;
      symbol: string;
      currency: string;
      instrument: Transaction["instrument"];
      transactions: Transaction[];
    }
  >();

  for (const transaction of transactions) {
    const identity = getInstrumentIdentity(
      transaction.instrument,
    );

    const key = `${transaction.portfolioId}:${identity}`;

    const existing = grouped.get(key);

    if (existing) {
      existing.transactions.push(transaction);
    } else {
      grouped.set(key, {
        portfolioId: transaction.portfolioId,
        symbol: transaction.symbol,
        currency:
          transaction.instrument.currency
            .trim()
            .toUpperCase(),
        instrument: transaction.instrument,
        transactions: [transaction],
      });
    }
  }

  const results: RealizedPnl[] = [];

  for (const group of grouped.values()) {
    const orderedTransactions = [
      ...group.transactions,
    ].sort(
      (a, b) =>
        new Date(a.executedAt).getTime() -
          new Date(b.executedAt).getTime() ||
        a.id.localeCompare(b.id),
    );

    let quantity = 0;
    let averageCost = 0;
    let realizedPnl = 0;
    let totalSoldCostBasis = 0;
    let totalSoldProceeds = 0;

    for (const transaction of orderedTransactions) {
      if (transaction.side === "buy") {
        const buyCost =
          transaction.quantity * transaction.price +
          transaction.fees;

        const existingCostBasis =
          quantity * averageCost;

        const newQuantity =
          quantity + transaction.quantity;

        averageCost =
          newQuantity === 0
            ? 0
            : roundFinancialValue(
                (existingCostBasis + buyCost) /
                  newQuantity,
              );

        quantity = newQuantity;
        continue;
      }

      if (transaction.quantity > quantity) {
        throw new PortfolioError(
          "insufficient_quantity",
          `Insufficient quantity of "${transaction.symbol}" for transaction "${transaction.id}".`,
        );
      }

      const costBasisOfSale =
        transaction.quantity * averageCost;

      const saleProceeds =
        transaction.quantity * transaction.price -
        transaction.fees;

      realizedPnl = roundFinancialValue(
        realizedPnl +
          saleProceeds -
          costBasisOfSale,
      );

      totalSoldCostBasis = roundFinancialValue(
        totalSoldCostBasis +
          costBasisOfSale,
      );

      totalSoldProceeds = roundFinancialValue(
        totalSoldProceeds +
          saleProceeds,
      );

      quantity -= transaction.quantity;

      if (quantity === 0) {
        averageCost = 0;
      }
    }

    const realizedPnlPercent =
      totalSoldCostBasis === 0
        ? 0
        : roundFinancialValue(
            ((totalSoldProceeds -
              totalSoldCostBasis) /
              totalSoldCostBasis) *
              100,
          );

    results.push({
      portfolioId: group.portfolioId,
      symbol: group.symbol,
      currency: group.currency,
      realizedPnl,
      realizedPnlPercent,
    });
  }

  return results;
}

export function calculatePortfolioValuation(
  portfolioId: string,
  baseCurrency: string,
  cashValue: number,
  positions: Position[],
  realizedPnl: number,
  asOf: string,
): PortfolioValuation {
  const positionsValue = roundFinancialValue(
    positions.reduce(
      (total, position) =>
        total + position.marketValue,
      0,
    ),
  );

  const totalCostBasis = roundFinancialValue(
    positions.reduce(
      (total, position) =>
        total + position.costBasis,
      0,
    ),
  );

  const unrealizedPnl = roundFinancialValue(
    positions.reduce(
      (total, position) =>
        total + position.unrealizedPnl,
      0,
    ),
  );

  const totalValue = roundFinancialValue(
    cashValue + positionsValue,
  );

  const totalPnl = roundFinancialValue(
    unrealizedPnl + realizedPnl,
  );

  const totalPnlPercent =
    totalCostBasis === 0
      ? 0
      : roundFinancialValue(
          (totalPnl / totalCostBasis) * 100,
        );

  return {
    portfolioId,
    baseCurrency,
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
import { PortfolioError } from "./errors";
import {
  calculatePosition,
  calculateRealizedPnl,
} from "./calculations";
import { getInstrumentIdentity } from "./identity";
import {
  validatePortfolio,
  validateTransaction,
} from "./validation";
import type {
  Portfolio,
  PortfolioValuation,
  Position,
  Transaction,
} from "./types";
import { calculateCurrencyAwareValuation } from "./valuation";
import { FxService } from "./fx-service";
import { normalizeCurrency } from "./currency";

export interface PortfolioServiceOptions {
  fxService?: FxService;
}

interface LedgerState {
  cashBalance: number;
  positions: Position[];
}

export class PortfolioService {
  private readonly portfolios = new Map<
    string,
    Portfolio
  >();

  private readonly initialCashBalances =
    new Map<string, number>();

  private readonly transactions = new Map<
    string,
    Transaction[]
  >();

  private readonly positions = new Map<
    string,
    Position[]
  >();

  private readonly fxService: FxService;

  constructor(
    options: PortfolioServiceOptions = {},
  ) {
    this.fxService =
      options.fxService ?? new FxService();
  }

  createPortfolio(
    portfolio: Portfolio,
  ): Portfolio {
    validatePortfolio(portfolio);

    if (this.portfolios.has(portfolio.id)) {
      throw new PortfolioError(
        "invalid_request",
        `Portfolio "${portfolio.id}" already exists.`,
      );
    }

    const stored: Portfolio = {
      ...portfolio,
      baseCurrency: normalizeCurrency(
        portfolio.baseCurrency,
      ),
    };

    this.portfolios.set(
      portfolio.id,
      stored,
    );

    this.initialCashBalances.set(
      portfolio.id,
      portfolio.cashBalance,
    );

    this.transactions.set(
      portfolio.id,
      [],
    );

    this.positions.set(
      portfolio.id,
      [],
    );

    return {
      ...stored,
    };
  }

  getPortfolio(
    portfolioId: string,
  ): Portfolio {
    const portfolio =
      this.portfolios.get(portfolioId);

    if (!portfolio) {
      throw new PortfolioError(
        "portfolio_not_found",
        `Portfolio "${portfolioId}" was not found.`,
      );
    }

    return {
      ...portfolio,
    };
  }

  listPortfolios(): Portfolio[] {
    return Array.from(
      this.portfolios.values(),
    ).map((portfolio) => ({
      ...portfolio,
    }));
  }

  getTransactions(
    portfolioId: string,
  ): Transaction[] {
    this.getPortfolio(portfolioId);

    return (
      this.transactions.get(portfolioId) ?? []
    )
      .map((transaction) => ({
        ...transaction,
      }))
      .sort(
        (a, b) =>
          new Date(a.executedAt).getTime() -
            new Date(b.executedAt).getTime() ||
          a.id.localeCompare(b.id),
      );
  }

  getPositions(
    portfolioId: string,
  ): Position[] {
    this.getPortfolio(portfolioId);

    return (
      this.positions.get(portfolioId) ?? []
    ).map((position) => ({
      ...position,
    }));
  }

  async recordTransaction(
    transaction: Transaction,
  ): Promise<Transaction> {
    validateTransaction(transaction);

    const portfolio =
      this.portfolios.get(
        transaction.portfolioId,
      );

    if (!portfolio) {
      throw new PortfolioError(
        "portfolio_not_found",
        `Portfolio "${transaction.portfolioId}" was not found.`,
      );
    }

    const existingTransactions =
      this.transactions.get(
        transaction.portfolioId,
      ) ?? [];

    if (
      existingTransactions.some(
        (item) => item.id === transaction.id,
      )
    ) {
      throw new PortfolioError(
        "invalid_transaction",
        `Transaction "${transaction.id}" already exists.`,
      );
    }

    const candidateTransactions = [
      ...existingTransactions,
      {
        ...transaction,
      },
    ].sort(
      (a, b) =>
        new Date(a.executedAt).getTime() -
          new Date(b.executedAt).getTime() ||
        a.id.localeCompare(b.id),
    );

    const previousPositions =
      this.positions.get(
        transaction.portfolioId,
      ) ?? [];

    const ledgerState =
      await this.calculateLedgerState(
        portfolio,
        candidateTransactions,
        previousPositions,
      );

    const updatedPortfolio: Portfolio = {
      ...portfolio,
      cashBalance:
        ledgerState.cashBalance,
      updatedAt:
        this.getLatestPortfolioTimestamp(
          portfolio.updatedAt,
          candidateTransactions,
        ),
    };

    this.transactions.set(
      transaction.portfolioId,
      candidateTransactions,
    );

    this.positions.set(
      transaction.portfolioId,
      ledgerState.positions,
    );

    this.portfolios.set(
      transaction.portfolioId,
      updatedPortfolio,
    );

    return {
      ...transaction,
    };
  }

  updatePosition(
    position: Position,
  ): Position {
    this.getPortfolio(
      position.portfolioId,
    );

    if (
      !position.instrument.symbol.trim()
    ) {
      throw new PortfolioError(
        "invalid_request",
        "Position symbol is required.",
      );
    }

    const calculated =
      calculatePosition(position);

    const updatedPosition: Position = {
      ...position,
      ...calculated,
    };

    const existingPositions =
      this.positions.get(
        position.portfolioId,
      ) ?? [];

    const identity =
      getInstrumentIdentity(
        position.instrument,
      );

    const index =
      existingPositions.findIndex(
        (item) =>
          getInstrumentIdentity(
            item.instrument,
          ) === identity,
      );

    if (index === -1) {
      existingPositions.push(
        updatedPosition,
      );
    } else {
      existingPositions[index] =
        updatedPosition;
    }

    this.positions.set(
      position.portfolioId,
      existingPositions,
    );

    return {
      ...updatedPosition,
    };
  }

  rebuildPosition(
    portfolioId: string,
    symbol: string,
    marketPrice: number,
    updatedAt: string,
    instrument?: Position["instrument"],
  ): Position | undefined {
    this.getPortfolio(portfolioId);

    const transactions =
      this.getTransactions(
        portfolioId,
      );

    const targetInstrument =
      instrument ??
      transactions.find(
        (transaction) =>
          transaction.symbol === symbol,
      )?.instrument;

    if (!targetInstrument) {
      throw new PortfolioError(
        "position_not_found",
        `Instrument "${symbol}" was not found in portfolio transactions.`,
      );
    }

    const targetIdentity =
      getInstrumentIdentity(
        targetInstrument,
      );

    const instrumentTransactions =
      transactions.filter(
        (transaction) =>
          getInstrumentIdentity(
            transaction.instrument,
          ) === targetIdentity,
      );

    const position =
      this.calculatePositionFromTransactions(
        portfolioId,
        targetInstrument,
        instrumentTransactions,
        this.positions
          .get(portfolioId)
          ?.find(
            (item) =>
              getInstrumentIdentity(
                item.instrument,
              ) === targetIdentity,
          ),
      );

    const existingPositions =
      this.positions.get(
        portfolioId,
      ) ?? [];

    const index =
      existingPositions.findIndex(
        (item) =>
          getInstrumentIdentity(
            item.instrument,
          ) === targetIdentity,
      );

    if (!position) {
      if (index !== -1) {
        existingPositions.splice(
          index,
          1,
        );
      }

      this.positions.set(
        portfolioId,
        existingPositions,
      );

      return undefined;
    }

    const updatedPosition: Position = {
      ...position,
      marketPrice,
      updatedAt,
      ...calculatePosition({
        ...position,
        marketPrice,
        updatedAt,
      }),
    };

    if (index === -1) {
      existingPositions.push(
        updatedPosition,
      );
    } else {
      existingPositions[index] =
        updatedPosition;
    }

    this.positions.set(
      portfolioId,
      existingPositions,
    );

    return {
      ...updatedPosition,
    };
  }

  async getValuation(
    portfolioId: string,
    asOf: string,
  ): Promise<PortfolioValuation> {
    const portfolio =
      this.getPortfolio(portfolioId);

    const positions =
      this.getPositions(portfolioId);

    const transactions =
      this.getTransactions(portfolioId);

    const realizedPnlResults =
      calculateRealizedPnl(
        transactions,
      ).filter(
        (result) =>
          result.portfolioId ===
          portfolioId,
      );

    const baseCurrency =
      normalizeCurrency(
        portfolio.baseCurrency,
      );

    const currencies = new Set<string>();

    for (const position of positions) {
      currencies.add(
        normalizeCurrency(
          position.instrument.currency,
        ),
      );
    }

    for (const result of realizedPnlResults) {
      currencies.add(
        normalizeCurrency(
          result.currency,
        ),
      );
    }

    const fxRates = new Map<
      string,
      {
        rate: number;
        asOf: string;
        providerId: string;
      }
    >();

    await Promise.all(
      Array.from(currencies).map(
        async (currency) => {
          const conversion =
            await this.fxService.convert(
              1,
              currency,
              baseCurrency,
            );

          fxRates.set(currency, {
            rate: conversion.rate,
            asOf: conversion.asOf,
            providerId:
              conversion.providerId,
          });
        },
      ),
    );

    const getFxRate = (
      currency: string,
    ) => {
      const normalizedCurrency =
        normalizeCurrency(currency);

      const conversion =
        fxRates.get(normalizedCurrency);

      if (!conversion) {
        throw new PortfolioError(
          "invalid_request",
          `No FX conversion is available for "${normalizedCurrency}" to "${baseCurrency}".`,
        );
      }

      return conversion;
    };

    const realizedPnl =
      realizedPnlResults.reduce(
        (total, result) => {
          const conversion =
            getFxRate(
              result.currency,
            );

          return (
            total +
            result.realizedPnl *
              conversion.rate
          );
        },
        0,
      );

    const valuationPositions =
      positions.map(
        (
          position: Position,
        ) => {
          const positionCurrency =
            normalizeCurrency(
              position.instrument.currency,
            );

          const conversion =
            getFxRate(
              positionCurrency,
            );

          return {
            position,
            currency: positionCurrency,
            convertedMarketValue:
              position.marketValue *
              conversion.rate,
            convertedCostBasis:
              position.costBasis *
              conversion.rate,
            convertedUnrealizedPnl:
              position.unrealizedPnl *
              conversion.rate,
            fxRate: conversion.rate,
            fxAsOf: conversion.asOf,
            fxProviderId:
              conversion.providerId,
          };
        },
      );

    return calculateCurrencyAwareValuation(
      portfolioId,
      baseCurrency,
      portfolio.cashBalance,
      valuationPositions,
      realizedPnl,
      asOf,
    );
  }

  private async calculateLedgerState(
    portfolio: Portfolio,
    transactions: Transaction[],
    previousPositions: Position[],
  ): Promise<LedgerState> {
    const initialCashBalance =
      this.initialCashBalances.get(
        portfolio.id,
      );

    if (
      initialCashBalance === undefined
    ) {
      throw new PortfolioError(
        "invalid_request",
        `Initial cash balance for portfolio "${portfolio.id}" is unavailable.`,
      );
    }

    let cashBalance =
      initialCashBalance;

    const positionsByIdentity =
      new Map<string, Position>();

    for (const position of previousPositions) {
      positionsByIdentity.set(
        getInstrumentIdentity(
          position.instrument,
        ),
        {
          ...position,
        },
      );
    }

    const transactionGroups =
      this.groupTransactionsByIdentity(
        transactions,
      );

    for (const transaction of transactions) {
      const transactionCurrency =
        normalizeCurrency(
          transaction.instrument.currency,
        );

      const baseCurrency =
        normalizeCurrency(
          portfolio.baseCurrency,
        );

      const transactionValue =
        transaction.quantity *
        transaction.price;

      const grossCashAmount =
        transaction.side === "buy"
          ? transactionValue +
            transaction.fees
          : transactionValue -
            transaction.fees;

      const conversion =
        await this.fxService.convert(
          grossCashAmount,
          transactionCurrency,
          baseCurrency,
        );

      const baseCurrencyCashImpact =
        conversion.amount;

      if (
        transaction.side === "buy"
      ) {
        cashBalance -=
          baseCurrencyCashImpact;

        if (cashBalance < 0) {
          throw new PortfolioError(
            "insufficient_cash",
            `Insufficient cash for transaction "${transaction.id}".`,
          );
        }
      } else {
        const identity =
          getInstrumentIdentity(
            transaction.instrument,
          );

        const group =
          transactionGroups.get(
            identity,
          ) ?? [];

        this.validateSellTransaction(
          transaction,
          group,
        );

        cashBalance +=
          baseCurrencyCashImpact;
      }
    }

    const rebuiltPositions: Position[] = [];

    for (
      const [
        identity,
        group,
      ] of transactionGroups
    ) {
      const existingPosition =
        positionsByIdentity.get(
          identity,
        );

      const position =
        this.calculatePositionFromTransactions(
          portfolio.id,
          group[0].instrument,
          group,
          existingPosition,
        );

      if (position) {
        rebuiltPositions.push(
          position,
        );
      }
    }

    if (
      !Number.isFinite(cashBalance)
    ) {
      throw new PortfolioError(
        "invalid_transaction",
        "Portfolio cash balance became invalid while rebuilding the transaction ledger.",
      );
    }

    return {
      cashBalance,
      positions:
        rebuiltPositions,
    };
  }

  private validateSellTransaction(
    transaction: Transaction,
    transactions: Transaction[],
  ): void {
    let quantity = 0;

    const orderedTransactions = [
      ...transactions,
    ].sort(
      (a, b) =>
        new Date(a.executedAt).getTime() -
          new Date(b.executedAt).getTime() ||
        a.id.localeCompare(b.id),
    );

    for (const item of orderedTransactions) {
      if (item.side === "buy") {
        quantity +=
          item.quantity;
      } else {
        if (
          item.quantity >
          quantity
        ) {
          throw new PortfolioError(
            "insufficient_quantity",
            `Insufficient quantity of "${item.symbol}" for transaction "${item.id}".`,
          );
        }

        quantity -=
          item.quantity;
      }

      if (
        item.id === transaction.id
      ) {
        break;
      }
    }
  }

  private groupTransactionsByIdentity(
    transactions: Transaction[],
  ): Map<string, Transaction[]> {
    const groups = new Map<
      string,
      Transaction[]
    >();

    for (const transaction of transactions) {
      const identity =
        getInstrumentIdentity(
          transaction.instrument,
        );

      const existing =
        groups.get(identity);

      if (existing) {
        existing.push(transaction);
      } else {
        groups.set(identity, [
          transaction,
        ]);
      }
    }

    return groups;
  }

  private calculatePositionFromTransactions(
    portfolioId: string,
    instrument: Position["instrument"],
    transactions: Transaction[],
    previousPosition?: Position,
  ): Position | undefined {
    const orderedTransactions = [
      ...transactions,
    ].sort(
      (a, b) =>
        new Date(a.executedAt).getTime() -
          new Date(b.executedAt).getTime() ||
        a.id.localeCompare(b.id),
    );

    let quantity = 0;
    let averageCost = 0;

    for (const transaction of orderedTransactions) {
      if (transaction.side === "buy") {
        const existingCostBasis =
          quantity * averageCost;

        const transactionCost =
          transaction.quantity *
            transaction.price +
          transaction.fees;

        const newQuantity =
          quantity +
          transaction.quantity;

        averageCost =
          newQuantity === 0
            ? 0
            : (existingCostBasis +
                transactionCost) /
              newQuantity;

        quantity =
          newQuantity;

        continue;
      }

      if (
        transaction.quantity >
        quantity
      ) {
        throw new PortfolioError(
          "insufficient_quantity",
          `Insufficient quantity of "${transaction.symbol}" for transaction "${transaction.id}".`,
        );
      }

      quantity -=
        transaction.quantity;

      if (quantity === 0) {
        averageCost = 0;
      }
    }

    if (quantity === 0) {
      return undefined;
    }

    const marketPrice =
      previousPosition?.marketPrice ??
      orderedTransactions[
        orderedTransactions.length - 1
      ].price;

    const updatedAt =
      previousPosition?.updatedAt ??
      orderedTransactions[
        orderedTransactions.length - 1
      ].executedAt;

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

  private getLatestPortfolioTimestamp(
    currentTimestamp: string,
    transactions: Transaction[],
  ): string {
    let latestTimestamp =
      currentTimestamp;

    for (const transaction of transactions) {
      if (
        new Date(
          transaction.executedAt,
        ).getTime() >
        new Date(
          latestTimestamp,
        ).getTime()
      ) {
        latestTimestamp =
          transaction.executedAt;
      }
    }

    return latestTimestamp;
  }
}
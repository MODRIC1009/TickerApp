"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createPortfolio,
  createTransaction,
  getPortfolioPositions,
  getPortfolioTransactions,
  getPortfolioValuation,
  getPortfolios,
  type CreatePortfolioRequest,
} from "@/lib/portfolio-api";
import {
  searchInstruments,
  type InstrumentSearchResult,
} from "@/lib/market-data-search-client";
import type {
  PortfolioValuation,
  Position,
  Transaction,
} from "@tickerapp/portfolio";

interface PortfolioWorkspaceProps {
  initialPortfolioId?: string;
}

type TransactionSide = Transaction["side"];

const MAX_INSTRUMENT_SEARCH_RESULTS = 8;

const EXCHANGE_NAMES: Record<string, string> = {
  nasdaq: "NASDAQ",
  nyse: "NYSE",
  tsx: "TSX",
  lse: "LSE",
  xetra: "Xetra",
  "euronext-paris": "Euronext Paris",
  "euronext-amsterdam": "Euronext Amsterdam",
  six: "SIX Swiss Exchange",
  nse: "NSE India",
  jpx: "Japan Exchange",
  hkex: "Hong Kong Exchange",
  sse: "Shanghai Stock Exchange",
  szse: "Shenzhen Stock Exchange",
  krx: "Korea Exchange",
  twse: "Taiwan Stock Exchange",
  sgx: "Singapore Exchange",
  asx: "Australian Securities Exchange",
  b3: "B3",
  bmv: "Mexican Stock Exchange",
  jse: "Johannesburg Stock Exchange",
};

function createPortfolioRequest(
  name: string,
  baseCurrency: string,
): CreatePortfolioRequest {
  const now = new Date().toISOString();

  return {
    id: `portfolio-${crypto.randomUUID()}`,
    name,
    baseCurrency,
    cashBalance: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function formatCurrency(
  value: number,
  currency: string,
): string {
  try {
    return value.toLocaleString(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function formatNumber(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getDateTimeLocalValue(): string {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(
    date.getTime() - offset * 60_000,
  );

  return localDate.toISOString().slice(0, 16);
}

function getExchangeLabel(
  result: InstrumentSearchResult,
): string {
  const exchangeId = result.instrument.exchangeId;

  if (exchangeId !== "unknown") {
    return (
      EXCHANGE_NAMES[exchangeId] ??
      exchangeId.toUpperCase()
    );
  }

  const providerExchangeId =
    result.instrument.metadata?.source?.providerExchangeId;

  if (providerExchangeId) {
    return providerExchangeId.toUpperCase();
  }

  return "Other Exchange";
}

function getExchangeDescription(
  result: InstrumentSearchResult,
): string {
  const exchangeId = result.instrument.exchangeId;

  if (exchangeId !== "unknown") {
    return (
      EXCHANGE_NAMES[exchangeId] ??
      exchangeId.toUpperCase()
    );
  }

  const providerExchangeId =
    result.instrument.metadata?.source?.providerExchangeId;

  return providerExchangeId
    ? `Provider exchange: ${providerExchangeId.toUpperCase()}`
    : "Exchange not mapped";
}

function getInstrumentSearchScore(
  result: InstrumentSearchResult,
  normalizedQuery: string,
): number {
  const instrument = result.instrument;
  const symbol = instrument.symbol.toUpperCase();
  const name = instrument.name.toUpperCase();

  let score = result.score ?? 0;

  if (symbol === normalizedQuery) {
    score += 10_000;
  } else if (symbol.startsWith(normalizedQuery)) {
    score += 5_000;
  } else if (symbol.includes(normalizedQuery)) {
    score += 2_000;
  }

  if (name === normalizedQuery) {
    score += 1_500;
  } else if (name.startsWith(normalizedQuery)) {
    score += 750;
  } else if (name.includes(normalizedQuery)) {
    score += 250;
  }

  if (instrument.exchangeId !== "unknown") {
    score += 500;
  }

  if (instrument.countryCode) {
    score += 100;
  }

  if (instrument.assetClass === "equity") {
    score += 100;
  } else if (instrument.assetClass === "etf") {
    score += 75;
  } else if (instrument.assetClass === "adr") {
    score += 50;
  } else if (instrument.assetClass === "reit") {
    score += 25;
  } else if (instrument.assetClass === "fund") {
    score -= 500;
  }

  return score;
}

function rankInstrumentResults(
  results: InstrumentSearchResult[],
  query: string,
): InstrumentSearchResult[] {
  const normalizedQuery = query.trim().toUpperCase();

  const deduplicated = new Map<
    string,
    InstrumentSearchResult
  >();

  for (const result of results) {
    const instrument = result.instrument;

    const providerExchangeId =
      instrument.metadata?.source?.providerExchangeId ??
      "";

    const key = [
      instrument.symbol.toUpperCase(),
      instrument.exchangeId,
      instrument.countryCode.toUpperCase(),
      instrument.currency.toUpperCase(),
      providerExchangeId.toUpperCase(),
    ].join(":");

    const existing = deduplicated.get(key);

    if (!existing) {
      deduplicated.set(key, result);
      continue;
    }

    const currentScore = getInstrumentSearchScore(
      result,
      normalizedQuery,
    );

    const existingScore = getInstrumentSearchScore(
      existing,
      normalizedQuery,
    );

    if (currentScore > existingScore) {
      deduplicated.set(key, result);
    }
  }

  return Array.from(deduplicated.values())
    .sort(
      (a, b) =>
        getInstrumentSearchScore(b, normalizedQuery) -
        getInstrumentSearchScore(a, normalizedQuery),
    )
    .slice(0, MAX_INSTRUMENT_SEARCH_RESULTS);
}

export function PortfolioWorkspace({
  initialPortfolioId,
}: PortfolioWorkspaceProps) {
  const transactionSectionRef =
    useRef<HTMLElement | null>(null);

  const [portfolios, setPortfolios] = useState<
    Awaited<ReturnType<typeof getPortfolios>>["portfolios"]
  >([]);

  const [selectedPortfolioId, setSelectedPortfolioId] =
    useState(initialPortfolioId ?? "");

  const [valuation, setValuation] =
    useState<PortfolioValuation | null>(null);

  const [positions, setPositions] =
    useState<Position[]>([]);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] =
    useState(false);
  const [isCreating, setIsCreating] =
    useState(false);
  const [isSubmittingTransaction, setIsSubmittingTransaction] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [name, setName] = useState("");
  const [baseCurrency, setBaseCurrency] =
    useState("USD");
  const [cashBalance, setCashBalance] =
    useState("");

  const [instrumentQuery, setInstrumentQuery] =
    useState("");

  const [instrumentResults, setInstrumentResults] =
    useState<InstrumentSearchResult[]>([]);

  const [selectedInstrument, setSelectedInstrument] =
    useState<InstrumentSearchResult | null>(null);

  const [isSearchingInstruments, setIsSearchingInstruments] =
    useState(false);

  const [transactionSide, setTransactionSide] =
    useState<TransactionSide>("buy");

  const [transactionQuantity, setTransactionQuantity] =
    useState("");

  const [transactionPrice, setTransactionPrice] =
    useState("");

  const [transactionFees, setTransactionFees] =
    useState("0");

  const [transactionExecutedAt, setTransactionExecutedAt] =
    useState(getDateTimeLocalValue());

  const loadPortfolios = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getPortfolios();

      setPortfolios(response.portfolios);

      if (
        response.portfolios.length > 0 &&
        !response.portfolios.some(
          (portfolio) =>
            portfolio.id === selectedPortfolioId,
        )
      ) {
        setSelectedPortfolioId(
          response.portfolios[0].id,
        );
      }

      if (response.portfolios.length === 0) {
        setSelectedPortfolioId("");
        setValuation(null);
        setPositions([]);
        setTransactions([]);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load portfolios.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedPortfolioId]);

  const loadPortfolioData = useCallback(
    async (
      portfolioId: string,
      showLoadingState = true,
    ) => {
      if (!portfolioId) {
        setValuation(null);
        setPositions([]);
        setTransactions([]);
        return;
      }

      if (showLoadingState) {
        setIsRefreshing(true);
      }

      setError(null);

      try {
        const [
          valuationResponse,
          positionsResponse,
          transactionsResponse,
        ] = await Promise.all([
          getPortfolioValuation(portfolioId),
          getPortfolioPositions(portfolioId),
          getPortfolioTransactions(portfolioId),
        ]);

        setValuation(valuationResponse.valuation);
        setPositions(positionsResponse.positions);
        setTransactions(
          transactionsResponse.transactions,
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load portfolio data.",
        );
      } finally {
        if (showLoadingState) {
          setIsRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function initializePortfolios() {
      if (cancelled) {
        return;
      }

      await loadPortfolios();
    }

    void initializePortfolios();

    return () => {
      cancelled = true;
    };
  }, [loadPortfolios]);

  useEffect(() => {
    let cancelled = false;

    async function initializePortfolioData() {
      if (cancelled || !selectedPortfolioId) {
        return;
      }

      await loadPortfolioData(selectedPortfolioId);
    }

    void initializePortfolioData();

    return () => {
      cancelled = true;
    };
  }, [
    selectedPortfolioId,
    loadPortfolioData,
  ]);

  async function handleCreatePortfolio() {
    const trimmedName = name.trim();
    const trimmedCurrency =
      baseCurrency.trim().toUpperCase();
    const parsedCash = Number(cashBalance);

    if (!trimmedName) {
      setError("Portfolio name is required.");
      return;
    }

    if (!trimmedCurrency) {
      setError("Base currency is required.");
      return;
    }

    if (
      !Number.isFinite(parsedCash) ||
      parsedCash < 0
    ) {
      setError(
        "Opening cash must be a valid non-negative number.",
      );
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await createPortfolio({
        ...createPortfolioRequest(
          trimmedName,
          trimmedCurrency,
        ),
        cashBalance: parsedCash,
      });

      setPortfolios((current) => [
        ...current,
        response.portfolio,
      ]);

      setSelectedPortfolioId(
        response.portfolio.id,
      );

      setName("");
      setBaseCurrency("USD");
      setCashBalance("");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create portfolio.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleSearchInstruments() {
    const trimmedQuery = instrumentQuery.trim();

    if (!trimmedQuery) {
      setInstrumentResults([]);
      return;
    }

    setIsSearchingInstruments(true);
    setError(null);

    try {
      const response =
        await searchInstruments(trimmedQuery);

      setInstrumentResults(
        rankInstrumentResults(
          response.results,
          trimmedQuery,
        ),
      );
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : "Failed to search instruments.",
      );

      setInstrumentResults([]);
    } finally {
      setIsSearchingInstruments(false);
    }
  }

  function handleSelectInstrument(
    result: InstrumentSearchResult,
  ) {
    setSelectedInstrument(result);
    setInstrumentQuery(result.instrument.symbol);
    setInstrumentResults([]);
  }

  function handleSelectPosition(
    position: Position,
  ) {
    const result = {
      instrument: position.instrument,
      score: 0,
    } as InstrumentSearchResult;

    setSelectedInstrument(result);
    setInstrumentQuery(
      position.instrument.symbol,
    );
    setInstrumentResults([]);
    setError(null);

    requestAnimationFrame(() => {
      transactionSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function handleClearInstrument() {
    setSelectedInstrument(null);
    setInstrumentQuery("");
    setInstrumentResults([]);
    setTransactionPrice("");
  }

  function getCurrentPosition(
    symbol: string,
  ): Position | undefined {
    return positions.find(
      (position) =>
        position.instrument.symbol === symbol,
    );
  }

  async function handleRecordTransaction() {
    if (!selectedPortfolioId) {
      setError(
        "Select a portfolio before recording a transaction.",
      );
      return;
    }

    if (!selectedInstrument) {
      setError(
        "Select an instrument before recording a transaction.",
      );
      return;
    }

    const parsedQuantity =
      Number(transactionQuantity);

    const parsedPrice =
      Number(transactionPrice);

    const parsedFees =
      Number(transactionFees);

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setError(
        "Quantity must be a valid positive number.",
      );
      return;
    }

    if (
      !Number.isFinite(parsedPrice) ||
      parsedPrice <= 0
    ) {
      setError(
        "Execution price must be a valid positive number.",
      );
      return;
    }

    if (
      !Number.isFinite(parsedFees) ||
      parsedFees < 0
    ) {
      setError(
        "Transaction fees must be a valid non-negative number.",
      );
      return;
    }

    if (!transactionExecutedAt) {
      setError(
        "Execution date and time are required.",
      );
      return;
    }

    const currentPosition =
      getCurrentPosition(
        selectedInstrument.instrument.symbol,
      );

    if (
      transactionSide === "sell" &&
      (!currentPosition ||
        currentPosition.quantity <
          parsedQuantity)
    ) {
      setError(
        `Insufficient quantity of "${selectedInstrument.instrument.symbol}" to sell.`,
      );
      return;
    }

    setIsSubmittingTransaction(true);
    setError(null);

    try {
      await createTransaction({
        id: `transaction-${crypto.randomUUID()}`,
        portfolioId: selectedPortfolioId,
        symbol:
          selectedInstrument.instrument.symbol,
        instrument:
          selectedInstrument.instrument,
        side: transactionSide,
        quantity: parsedQuantity,
        price: parsedPrice,
        fees: parsedFees,
        executedAt: new Date(
          transactionExecutedAt,
        ).toISOString(),
      });

      await loadPortfolioData(
        selectedPortfolioId,
        false,
      );

      setTransactionQuantity("");
      setTransactionPrice("");
      setTransactionFees("0");
      setTransactionExecutedAt(
        getDateTimeLocalValue(),
      );
    } catch (transactionError) {
      setError(
        transactionError instanceof Error
          ? transactionError.message
          : "Failed to record transaction.",
      );
    } finally {
      setIsSubmittingTransaction(false);
    }
  }

  async function handleRefresh() {
    if (!selectedPortfolioId) {
      return;
    }

    await loadPortfolioData(
      selectedPortfolioId,
    );
  }

  const selectedPortfolio =
    portfolios.find(
      (portfolio) =>
        portfolio.id === selectedPortfolioId,
    ) ?? null;

  const selectedPosition = selectedInstrument
    ? getCurrentPosition(
        selectedInstrument.instrument.symbol,
      )
    : undefined;

  const totalValue =
    valuation?.totalValue ?? 0;

  const cashValue =
    valuation?.cashValue ??
    selectedPortfolio?.cashBalance ??
    0;

  const investedValue =
    valuation?.positionsValue ?? 0;

  const totalPnl =
    valuation?.totalPnl ?? 0;

  const totalPnlPercent =
    valuation?.totalPnlPercent ?? 0;

  return (
    <>
      <section className="mb-6 rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-col gap-5">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                Active Portfolio
              </p>

              {isLoading ? (
                <p className="mt-2 text-sm text-muted">
                  Loading portfolios...
                </p>
              ) : portfolios.length === 0 ? (
                <p className="mt-2 text-sm font-medium text-foreground">
                  No portfolio selected
                </p>
              ) : (
                <select
                  value={selectedPortfolioId}
                  onChange={(event) =>
                    setSelectedPortfolioId(
                      event.target.value,
                    )
                  }
                  className="mt-2 w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent"
                >
                  {portfolios.map(
                    (portfolio) => (
                      <option
                        key={portfolio.id}
                        value={portfolio.id}
                      >
                        {portfolio.name}
                      </option>
                    ),
                  )}
                </select>
              )}

              {selectedPortfolio ? (
                <p className="mt-2 text-xs text-muted">
                  {selectedPortfolio.baseCurrency} · Opening cash{" "}
                  {formatCurrency(
                    selectedPortfolio.cashBalance,
                    selectedPortfolio.baseCurrency,
                  )}
                </p>
              ) : null}
            </div>

            {selectedPortfolio ? (
              <button
                type="button"
                onClick={() =>
                  void handleRefresh()
                }
                disabled={isRefreshing}
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRefreshing
                  ? "Refreshing..."
                  : "Refresh Data"}
              </button>
            ) : null}
          </div>

          <div className="border-t border-border-subtle pt-4">
            <div className="mb-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                Create Portfolio
              </p>
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(100px,0.75fr)_minmax(150px,1fr)_auto]">
              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Portfolio name"
                aria-label="Portfolio name"
                className="min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted transition-colors focus:border-accent"
              />

              <input
                value={baseCurrency}
                onChange={(event) =>
                  setBaseCurrency(
                    event.target.value,
                  )
                }
                placeholder="USD"
                aria-label="Base currency"
                maxLength={3}
                className="min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-sm uppercase text-foreground outline-none placeholder:text-muted transition-colors focus:border-accent"
              />

              <input
                value={cashBalance}
                onChange={(event) =>
                  setCashBalance(
                    event.target.value,
                  )
                }
                placeholder="Opening cash"
                aria-label="Opening cash"
                inputMode="decimal"
                className="min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted transition-colors focus:border-accent"
              />

              <button
                type="button"
                onClick={() =>
                  void handleCreatePortfolio()
                }
                disabled={isCreating}
                className="rounded-lg border border-accent/40 bg-accent-muted px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:border-accent hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 lg:col-span-1"
              >
                {isCreating
                  ? "Creating..."
                  : "Create"}
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2.5 text-sm text-red-400">
            {error}
          </div>
        ) : null}
      </section>

      {selectedPortfolio ? (
        <section
          ref={transactionSectionRef}
          className="mb-6 scroll-mt-6 rounded-xl border border-border bg-surface p-5"
        >
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
                Transactions
              </p>

              <h2 className="mt-2 text-lg font-semibold text-foreground">
                Record Transaction
              </h2>

              <p className="mt-2 max-w-2xl text-xs leading-5 text-muted">
                Record executed buys and sells against the active
                portfolio. Instrument selection uses the global
                market-data search service.
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_auto]">
              <div className="relative min-w-0">
                <div className="flex gap-2">
                  <input
                    value={instrumentQuery}
                    onChange={(event) => {
                      setInstrumentQuery(
                        event.target.value,
                      );
                      setSelectedInstrument(null);
                      setInstrumentResults([]);
                    }}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter"
                      ) {
                        event.preventDefault();
                        void handleSearchInstruments();
                      }
                    }}
                    placeholder="Search symbol or company name"
                    aria-label="Search instrument"
                    className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted transition-colors focus:border-accent"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      void handleSearchInstruments()
                    }
                    disabled={
                      isSearchingInstruments ||
                      !instrumentQuery.trim()
                    }
                    className="shrink-0 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSearchingInstruments
                      ? "Searching..."
                      : "Search"}
                  </button>
                </div>

                {instrumentResults.length >
                0 ? (
                  <div className="absolute left-0 right-0 z-20 mt-2 max-h-80 overflow-y-auto rounded-lg border border-border bg-surface shadow-xl">
                    {instrumentResults.map(
                      (result) => (
                        <button
                          key={[
                            result.instrument
                              .symbol,
                            result.instrument
                              .exchangeId,
                            result.instrument
                              .countryCode,
                            result.instrument
                              .currency,
                            result.instrument
                              .metadata
                              ?.source
                              ?.providerExchangeId ??
                              "",
                          ].join("-")}
                          type="button"
                          onClick={() =>
                            handleSelectInstrument(
                              result,
                            )
                          }
                          className="block w-full border-b border-border-subtle px-4 py-3 text-left last:border-0 hover:bg-surface-hover"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-foreground">
                                  {
                                    result
                                      .instrument
                                      .symbol
                                  }
                                </p>

                                {result.instrument.symbol
                                  .toUpperCase() ===
                                instrumentQuery
                                  .trim()
                                  .toUpperCase() ? (
                                  <span className="rounded bg-accent-muted px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-accent">
                                    Exact
                                  </span>
                                ) : null}
                              </div>

                              <p className="mt-1 truncate text-xs text-muted">
                                {
                                  result
                                    .instrument
                                    .name
                                }
                              </p>
                            </div>

                            <div className="shrink-0 text-right">
                              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-foreground">
                                {getExchangeLabel(
                                  result,
                                )}
                              </p>

                              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted">
                                {result.instrument
                                  .countryCode ||
                                  result.instrument
                                    .metadata
                                    ?.source
                                    ?.providerExchangeId ||
                                  "Other"}
                                {" · "}
                                {
                                  result.instrument
                                    .currency
                                }
                              </p>
                            </div>
                          </div>
                        </button>
                      ),
                    )}
                  </div>
                ) : null}
              </div>

              {selectedInstrument ? (
                <button
                  type="button"
                  onClick={
                    handleClearInstrument
                  }
                  className="rounded-lg border border-border bg-background px-4 py-2.5 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                >
                  Clear Instrument
                </button>
              ) : null}
            </div>

            {selectedInstrument ? (
              <div className="rounded-lg border border-accent/30 bg-accent-muted/30 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {
                        selectedInstrument
                          .instrument
                          .symbol
                      }
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      {
                        selectedInstrument
                          .instrument
                          .name
                      }
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-[0.12em] text-muted">
                      <span>
                        {getExchangeDescription(
                          selectedInstrument,
                        )}
                      </span>

                      <span>·</span>

                      <span>
                        {selectedInstrument
                          .instrument
                          .countryCode ||
                          "International"}
                      </span>

                      <span>·</span>

                      <span>
                        {
                          selectedInstrument
                            .instrument
                            .currency
                        }
                      </span>
                    </div>
                  </div>

                  {selectedPosition ? (
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-muted">
                        Current Position
                      </p>

                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {formatNumber(
                          selectedPosition.quantity,
                        )}{" "}
                        shares
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label
                  htmlFor="transaction-side"
                  className="mb-2 block text-[10px] font-medium uppercase tracking-[0.14em] text-muted"
                >
                  Side
                </label>

                <select
                  id="transaction-side"
                  value={transactionSide}
                  onChange={(event) =>
                    setTransactionSide(
                      event.target
                        .value as TransactionSide,
                    )
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent"
                >
                  <option value="buy">
                    Buy
                  </option>
                  <option value="sell">
                    Sell
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="transaction-quantity"
                  className="mb-2 block text-[10px] font-medium uppercase tracking-[0.14em] text-muted"
                >
                  Quantity
                </label>

                <input
                  id="transaction-quantity"
                  value={transactionQuantity}
                  onChange={(event) =>
                    setTransactionQuantity(
                      event.target.value,
                    )
                  }
                  placeholder="0"
                  inputMode="decimal"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted transition-colors focus:border-accent"
                />
              </div>

              <div>
                <label
                  htmlFor="transaction-price"
                  className="mb-2 block text-[10px] font-medium uppercase tracking-[0.14em] text-muted"
                >
                  Execution Price
                </label>

                <input
                  id="transaction-price"
                  value={transactionPrice}
                  onChange={(event) =>
                    setTransactionPrice(
                      event.target.value,
                    )
                  }
                  placeholder="0.00"
                  inputMode="decimal"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted transition-colors focus:border-accent"
                />
              </div>

              <div>
                <label
                  htmlFor="transaction-fees"
                  className="mb-2 block text-[10px] font-medium uppercase tracking-[0.14em] text-muted"
                >
                  Fees
                </label>

                <input
                  id="transaction-fees"
                  value={transactionFees}
                  onChange={(event) =>
                    setTransactionFees(
                      event.target.value,
                    )
                  }
                  placeholder="0.00"
                  inputMode="decimal"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted transition-colors focus:border-accent"
                />
              </div>

              <div>
                <label
                  htmlFor="transaction-executed-at"
                  className="mb-2 block text-[10px] font-medium uppercase tracking-[0.14em] text-muted"
                >
                  Executed At
                </label>

                <input
                  id="transaction-executed-at"
                  type="datetime-local"
                  value={transactionExecutedAt}
                  onChange={(event) =>
                    setTransactionExecutedAt(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border-subtle pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted">
                {selectedInstrument ? (
                  <>
                    {transactionSide === "buy"
                      ? "Buying"
                      : "Selling"}{" "}
                    {
                      selectedInstrument
                        .instrument
                        .symbol
                    }
                  </>
                ) : (
                  "Select an instrument to continue."
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleRecordTransaction()
                }
                disabled={
                  isSubmittingTransaction ||
                  !selectedInstrument
                }
                className="rounded-lg border border-accent/40 bg-accent-muted px-5 py-2.5 text-sm font-medium text-accent transition-colors hover:border-accent hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingTransaction
                  ? "Recording..."
                  : "Record Transaction"}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Total Value
          </p>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            {formatCurrency(
              totalValue,
              selectedPortfolio?.baseCurrency ??
                "USD",
            )}
          </p>

          <p className="mt-2 text-xs text-muted">
            Current portfolio value
          </p>
        </article>

        <article className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Cash
          </p>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            {formatCurrency(
              cashValue,
              selectedPortfolio?.baseCurrency ??
                "USD",
            )}
          </p>

          <p className="mt-2 text-xs text-muted">
            Available portfolio cash
          </p>
        </article>

        <article className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Invested
          </p>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            {formatCurrency(
              investedValue,
              selectedPortfolio?.baseCurrency ??
                "USD",
            )}
          </p>

          <p className="mt-2 text-xs text-muted">
            Current position value
          </p>
        </article>

        <article className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Total P&amp;L
          </p>

          <p
            className={`mt-3 text-2xl font-semibold tracking-tight ${
              totalPnl > 0
                ? "text-accent"
                : totalPnl < 0
                  ? "text-red-400"
                  : "text-foreground"
            }`}
          >
            {formatCurrency(
              totalPnl,
              selectedPortfolio?.baseCurrency ??
                "USD",
            )}
          </p>

          <p className="mt-2 text-xs text-muted">
            {totalPnlPercent.toFixed(2)}% total return
          </p>
        </article>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
                Holdings
              </p>

              <h2 className="mt-2 text-lg font-semibold text-foreground">
                Portfolio Positions
              </h2>
            </div>

            <span className="rounded-md border border-border-subtle bg-background px-2.5 py-1 text-xs text-muted">
              {positions.length}{" "}
              {positions.length === 1
                ? "position"
                : "positions"}
            </span>
          </div>

          {positions.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-border-subtle bg-background/50 px-5 py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                No positions yet
              </p>

              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted">
                Record your first transaction to begin tracking
                holdings and portfolio performance.
              </p>
            </div>
          ) : (
            <div className="mt-5 max-h-[28rem] overflow-auto rounded-lg border border-border-subtle">
              <table className="w-full min-w-[680px] text-left">
                <thead className="sticky top-0 z-10 bg-surface">
                  <tr className="border-b border-border-subtle text-[10px] uppercase tracking-[0.14em] text-muted">
                    <th className="px-3 py-3 font-medium">
                      Instrument
                    </th>
                    <th className="px-3 py-3 text-right font-medium">
                      Quantity
                    </th>
                    <th className="px-3 py-3 text-right font-medium">
                      Avg Cost
                    </th>
                    <th className="px-3 py-3 text-right font-medium">
                      Market Price
                    </th>
                    <th className="px-3 py-3 text-right font-medium">
                      Value
                    </th>
                    <th className="px-3 py-3 text-right font-medium">
                      P&amp;L
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {positions.map(
                    (position) => (
                      <tr
                        key={`${position.portfolioId}-${position.instrument.exchangeId}-${position.instrument.symbol}`}
                        className="border-b border-border-subtle last:border-0"
                      >
                        <td className="px-3 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectPosition(
                                position,
                              )
                            }
                            title={`Select ${position.instrument.symbol} for a transaction`}
                            className="group block w-full text-left"
                          >
                            <div className="font-medium text-accent underline-offset-4 group-hover:underline">
                              {
                                position.instrument
                                  .symbol
                              }
                            </div>

                            <div className="mt-1 text-xs text-muted">
                              {
                                position.instrument
                                  .name
                              }
                            </div>

                            <div className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted">
                              Click to trade
                            </div>
                          </button>
                        </td>

                        <td className="px-3 py-4 text-right text-sm text-foreground">
                          {formatNumber(
                            position.quantity,
                          )}
                        </td>

                        <td className="px-3 py-4 text-right text-sm text-muted-strong">
                          {formatCurrency(
                            position.averageCost,
                            position.instrument
                              .currency,
                          )}
                        </td>

                        <td className="px-3 py-4 text-right text-sm text-foreground">
                          {formatCurrency(
                            position.marketPrice,
                            position.instrument
                              .currency,
                          )}
                        </td>

                        <td className="px-3 py-4 text-right text-sm font-medium text-foreground">
                          {formatCurrency(
                            position.marketValue,
                            position.instrument
                              .currency,
                          )}
                        </td>

                        <td
                          className={`px-3 py-4 text-right text-sm font-medium ${
                            position.unrealizedPnl >
                            0
                              ? "text-accent"
                              : position.unrealizedPnl <
                                  0
                                ? "text-red-400"
                                : "text-muted-strong"
                          }`}
                        >
                          <div>
                            {formatCurrency(
                              position.unrealizedPnl,
                              position.instrument
                                .currency,
                            )}
                          </div>

                          <div className="mt-1 text-xs">
                            {position.unrealizedPnlPercent.toFixed(
                              2,
                            )}
                            %
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
                Activity
              </p>

              <h2 className="mt-2 text-lg font-semibold text-foreground">
                Recent Transactions
              </h2>
            </div>

            <span className="rounded-md border border-border-subtle bg-background px-2.5 py-1 text-xs text-muted">
              {transactions.length}
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-border-subtle bg-background/50 px-5 py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                No transactions yet
              </p>

              <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-muted">
                Transactions will appear here once you start
                recording portfolio activity.
              </p>
            </div>
          ) : (
            <div className="mt-5 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
              {[...transactions]
                .sort(
                  (a, b) =>
                    new Date(
                      b.executedAt,
                    ).getTime() -
                    new Date(
                      a.executedAt,
                    ).getTime(),
                )
                .map(
                  (transaction) => (
                    <div
                      key={transaction.id}
                      className="rounded-lg border border-border-subtle bg-background/50 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                                transaction.side ===
                                "buy"
                                  ? "bg-accent-muted text-accent"
                                  : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              {
                                transaction.side
                              }
                            </span>

                            <span className="text-sm font-semibold text-foreground">
                              {
                                transaction.symbol
                              }
                            </span>
                          </div>

                          <p className="mt-2 text-xs text-muted">
                            {formatDate(
                              transaction.executedAt,
                            )}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">
                            {formatNumber(
                              transaction.quantity,
                            )}{" "}
                            ×{" "}
                            {formatCurrency(
                              transaction.price,
                              transaction
                                .instrument
                                .currency,
                            )}
                          </p>

                          {transaction.fees >
                          0 ? (
                            <p className="mt-1 text-xs text-muted">
                              Fee{" "}
                              {formatCurrency(
                                transaction.fees,
                                transaction
                                  .instrument
                                  .currency,
                              )}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ),
                )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
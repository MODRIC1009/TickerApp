"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type Position = {
  symbol: string;
  quantity: number;
  averageCost: number;
  marketPrice: number | null;
  marketValue: number | null;
  unrealizedPnL: number | null;
  unrealizedPnLPercent: number | null;
};

type PortfolioResponse = {
  portfolio?: {
    id: string;
    name: string;
    baseCurrency: string;
  };
  positions?: Position[];
  totalMarketValue?: number;
  totalCostBasis?: number;
  totalUnrealizedPnL?: number;
  totalUnrealizedPnLPercent?: number;
  error?: string;
};

const defaultPortfolioId = "default";

function formatMoney(
  value: number | null,
  currency: string,
) {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  const prefix =
    currency === "USD"
      ? "$"
      : currency === "INR"
        ? "₹"
        : currency === "EUR"
          ? "€"
          : currency === "GBP"
            ? "£"
            : "";

  return `${prefix}${value.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`;
}

function formatCompactMoney(
  value: number | null,
  currency: string,
) {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  const prefix =
    currency === "USD"
      ? "$"
      : currency === "INR"
        ? "₹"
        : currency === "EUR"
          ? "€"
          : currency === "GBP"
            ? "£"
            : "";

  const absolute = Math.abs(value);

  if (absolute >= 1_000_000_000_000) {
    return `${prefix}${(
      value / 1_000_000_000_000
    ).toFixed(2)}T`;
  }

  if (absolute >= 1_000_000_000) {
    return `${prefix}${(
      value / 1_000_000_000
    ).toFixed(2)}B`;
  }

  if (absolute >= 1_000_000) {
    return `${prefix}${(
      value / 1_000_000
    ).toFixed(2)}M`;
  }

  if (absolute >= 1_000) {
    return `${prefix}${(
      value / 1_000
    ).toFixed(2)}K`;
  }

  return `${prefix}${value.toFixed(2)}`;
}

function formatPercent(
  value: number | null,
) {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(
    2,
  )}%`;
}

function formatQuantity(value: number) {
  return value.toLocaleString(
    "en-US",
    {
      maximumFractionDigits: 6,
    },
  );
}

function getChangeClass(
  value: number | null,
) {
  if (value === null || value === 0) {
    return "text-muted";
  }

  return value > 0
    ? "text-accent"
    : "text-negative";
}

function getPositionWeight(
  position: Position,
  totalMarketValue: number,
) {
  if (
    totalMarketValue <= 0 ||
    position.marketValue === null ||
    !Number.isFinite(position.marketValue)
  ) {
    return null;
  }

  return (
    (Math.max(0, position.marketValue) /
      totalMarketValue) *
    100
  );
}

function LoadingState() {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-label="Portfolio intelligence loading"
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from(
          { length: 4 },
          (_, index) => (
            <div
              key={index}
              className="glass-panel h-32 animate-pulse rounded-2xl"
            />
          ),
        )}
      </section>

      <section className="glass-panel h-[28rem] animate-pulse rounded-2xl" />

      <section className="glass-panel h-48 animate-pulse rounded-2xl" />
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <section className="glass-panel-elevated overflow-hidden rounded-2xl">
      <div className="spatial-grid absolute inset-0 opacity-15" />

      <div className="relative px-6 py-16 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-negative/20 bg-negative-muted text-negative">
          <span className="font-mono text-lg">
            !
          </span>
        </div>

        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Portfolio intelligence
        </p>

        <h2 className="mt-2 text-base font-semibold text-foreground">
          Portfolio unavailable
        </h2>

        <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted">
          {error}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-xl border border-border bg-surface-hover px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-border-strong hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          Retry valuation
        </button>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  description,
  valueClassName = "text-foreground",
  eyebrow,
}: {
  label: string;
  value: string;
  description?: string;
  valueClassName?: string;
  eyebrow?: string;
}) {
  return (
    <article className="glass-panel-elevated group relative overflow-hidden rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-0.5">
      <div className="spatial-grid pointer-events-none absolute inset-0 opacity-10" />

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {label}
          </p>

          {eyebrow ? (
            <span className="rounded-full border border-border-subtle bg-surface-hover px-2 py-1 text-[9px] font-medium uppercase tracking-[0.1em] text-muted">
              {eyebrow}
            </span>
          ) : null}
        </div>

        <p
          className={`mt-3 font-mono text-xl font-semibold tracking-[-0.02em] ${valueClassName}`}
        >
          {value}
        </p>

        {description ? (
          <p className="mt-2 text-xs leading-5 text-muted">
            {description}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function InsightCard({
  label,
  value,
  description,
  status = "neutral",
}: {
  label: string;
  value: string;
  description: string;
  status?: "positive" | "warning" | "neutral";
}) {
  const dotClass =
    status === "positive"
      ? "bg-accent"
      : status === "warning"
        ? "bg-warning"
        : "bg-muted";

  return (
    <div className="group bg-surface p-5 transition-colors hover:bg-surface-hover">
      <div className="flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotClass}`}
        />

        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          {label}
        </p>
      </div>

      <p className="mt-3 text-sm font-semibold text-foreground">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-muted">
        {description}
      </p>
    </div>
  );
}

function EmptyPositionsState() {
  return (
    <div className="relative px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background font-mono text-sm text-muted">
        —
      </div>

      <h3 className="mt-5 text-sm font-semibold text-foreground">
        No positions yet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted">
        Add portfolio transactions to build
        your holdings and unlock portfolio
        valuation, allocation,
        diversification, and risk analytics.
      </p>
    </div>
  );
}

export function PortfolioWorkspace() {
  const [portfolio, setPortfolio] =
    useState<PortfolioResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadPortfolio = useCallback(
    async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/portfolio/${encodeURIComponent(
            defaultPortfolioId,
          )}/positions`,
          {
            cache: "no-store",
          },
        );

        const payload =
          (await response.json()) as PortfolioResponse;

        if (!response.ok) {
          throw new Error(
            payload.error ??
              "Portfolio could not be loaded.",
          );
        }

        setPortfolio(payload);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load portfolio.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInitialPortfolio() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/portfolio/${encodeURIComponent(
            defaultPortfolioId,
          )}/positions`,
          {
            cache: "no-store",
          },
        );

        const payload =
          (await response.json()) as PortfolioResponse;

        if (!response.ok) {
          throw new Error(
            payload.error ??
              "Portfolio could not be loaded.",
          );
        }

        if (!cancelled) {
          setPortfolio(payload);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load portfolio.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitialPortfolio();

    const interval =
      window.setInterval(() => {
        void loadInitialPortfolio();
      }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  /*
   * Memoizing this derived array fixes the
   * exhaustive-deps warning and also avoids
   * creating a new array on every render.
   */
  const positions = useMemo(
    () => portfolio?.positions ?? [],
    [portfolio?.positions],
  );

  const currency =
    portfolio?.portfolio?.baseCurrency ??
    "USD";

  const totals = useMemo(() => {
    const marketValue = positions.reduce(
      (total, position) =>
        total +
        (position.marketValue ?? 0),
      0,
    );

    const costBasis = positions.reduce(
      (total, position) =>
        total +
        position.averageCost *
          position.quantity,
      0,
    );

    const pnl = positions.reduce(
      (total, position) =>
        total +
        (position.unrealizedPnL ?? 0),
      0,
    );

    const pnlPercent =
      costBasis !== 0
        ? (pnl / costBasis) * 100
        : null;

    return {
      marketValue,
      costBasis,
      pnl,
      pnlPercent,
    };
  }, [positions]);

  const allocation = useMemo(() => {
    return [...positions]
      .map((position) => ({
        position,
        weight: getPositionWeight(
          position,
          totals.marketValue,
        ),
      }))
      .filter(
        (
          item,
        ): item is {
          position: Position;
          weight: number;
        } =>
          item.weight !== null &&
          item.weight > 0,
      )
      .sort(
        (a, b) =>
          b.weight - a.weight,
      );
  }, [positions, totals.marketValue]);

  const largestPosition =
    allocation[0] ?? null;

  const positivePositions = useMemo(
    () =>
      positions.filter(
        (position) =>
          position.unrealizedPnL !== null &&
          position.unrealizedPnL > 0,
      ).length,
    [positions],
  );

  const negativePositions = useMemo(
    () =>
      positions.filter(
        (position) =>
          position.unrealizedPnL !== null &&
          position.unrealizedPnL < 0,
      ).length,
    [positions],
  );

  const valuedPositions = useMemo(
    () =>
      positions.filter(
        (position) =>
          position.marketValue !== null &&
          Number.isFinite(
            position.marketValue,
          ),
      ).length,
    [positions],
  );

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={() => {
          void loadPortfolio();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Market Value"
          value={formatCompactMoney(
            totals.marketValue,
            currency,
          )}
          description={`${valuedPositions} of ${positions.length} positions valued`}
          eyebrow="Valuation"
        />

        <Metric
          label="Cost Basis"
          value={formatCompactMoney(
            totals.costBasis,
            currency,
          )}
          description="Calculated from recorded position quantities and average costs"
          eyebrow="Calculated"
        />

        <Metric
          label="Unrealized P&L"
          value={formatMoney(
            totals.pnl,
            currency,
          )}
          valueClassName={getChangeClass(
            totals.pnl,
          )}
          description={
            totals.pnlPercent !== null
              ? formatPercent(
                  totals.pnlPercent,
                )
              : "Return unavailable"
          }
          eyebrow="Live"
        />

        <Metric
          label="Base Currency"
          value={currency}
          description={
            portfolio?.portfolio?.name ??
            "Default portfolio"
          }
          eyebrow="Portfolio"
        />
      </section>

      <section className="glass-panel-elevated relative overflow-hidden rounded-2xl">
        <div className="spatial-grid pointer-events-none absolute inset-0 opacity-10" />

        <div className="relative flex flex-col justify-between gap-4 border-b border-border-subtle px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_currentColor]" />

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Holdings
              </p>
            </div>

            <h2 className="mt-1.5 text-base font-semibold text-foreground">
              Portfolio positions
            </h2>

            <p className="mt-1 text-xs text-muted">
              Current portfolio exposure and
              provider-backed valuation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border-subtle bg-surface-hover px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-muted">
              {positions.length}{" "}
              {positions.length === 1
                ? "position"
                : "positions"}
            </span>

            <span className="rounded-full border border-accent/20 bg-accent-muted px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-accent">
              Live valuation
            </span>
          </div>
        </div>

        {positions.length === 0 ? (
          <EmptyPositionsState />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="data-table w-full min-w-[900px] text-left">
              <thead>
                <tr>
                  <th>Security</th>
                  <th className="text-right">
                    Allocation
                  </th>
                  <th className="text-right">
                    Quantity
                  </th>
                  <th className="text-right">
                    Avg. Cost
                  </th>
                  <th className="text-right">
                    Market Price
                  </th>
                  <th className="text-right">
                    Market Value
                  </th>
                  <th className="text-right">
                    P&amp;L
                  </th>
                </tr>
              </thead>

              <tbody>
                {positions.map(
                  (position, index) => {
                    const weight =
                      getPositionWeight(
                        position,
                        totals.marketValue,
                      );

                    return (
                      <tr
                        key={`${position.symbol}-${index}`}
                        className="group transition-colors hover:bg-surface-hover"
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle bg-surface-hover font-mono text-[10px] font-semibold text-muted transition-colors group-hover:border-border group-hover:text-foreground">
                              {position.symbol.slice(
                                0,
                                2,
                              )}
                            </div>

                            <div>
                              <div className="font-mono text-sm font-semibold text-foreground">
                                {position.symbol}
                              </div>

                              <div className="mt-0.5 text-[10px] text-muted">
                                Equity position
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="text-right">
                          {weight !== null ? (
                            <div className="inline-flex min-w-[86px] flex-col items-end gap-1">
                              <span className="font-mono text-xs text-muted-strong">
                                {weight.toFixed(
                                  1,
                                )}
                                %
                              </span>

                              <span className="h-1 w-16 overflow-hidden rounded-full bg-surface-hover">
                                <span
                                  className="block h-full rounded-full bg-accent/70"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      weight,
                                    )}%`,
                                  }}
                                />
                              </span>
                            </div>
                          ) : (
                            <span className="font-mono text-xs text-muted">
                              —
                            </span>
                          )}
                        </td>

                        <td className="font-mono text-xs text-muted-strong text-right">
                          {formatQuantity(
                            position.quantity,
                          )}
                        </td>

                        <td className="font-mono text-xs text-muted-strong text-right">
                          {formatMoney(
                            position.averageCost,
                            currency,
                          )}
                        </td>

                        <td className="font-mono text-xs text-muted-strong text-right">
                          {formatMoney(
                            position.marketPrice,
                            currency,
                          )}
                        </td>

                        <td className="font-mono text-xs font-medium text-foreground text-right">
                          {formatMoney(
                            position.marketValue,
                            currency,
                          )}
                        </td>

                        <td className="text-right">
                          <div
                            className={`font-mono text-xs font-medium ${getChangeClass(
                              position.unrealizedPnL,
                            )}`}
                          >
                            {formatMoney(
                              position.unrealizedPnL,
                              currency,
                            )}
                          </div>

                          <div
                            className={`mt-1 font-mono text-[10px] ${getChangeClass(
                              position.unrealizedPnLPercent,
                            )}`}
                          >
                            {formatPercent(
                              position.unrealizedPnLPercent,
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {positions.length > 0 ? (
        <>
          <section className="glass-panel-elevated relative overflow-hidden rounded-2xl">
            <div className="spatial-grid pointer-events-none absolute inset-0 opacity-10" />

            <div className="relative border-b border-border-subtle px-5 py-5 sm:px-6">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    Allocation intelligence
                  </p>

                  <h2 className="mt-1.5 text-base font-semibold text-foreground">
                    Portfolio concentration
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-muted">
                    Current position weights based
                    on available market values.
                  </p>
                </div>

                <span className="rounded-full border border-border-subtle bg-surface-hover px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-muted">
                  {allocation.length} valued
                </span>
              </div>
            </div>

            <div className="relative grid gap-0 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="border-b border-border-subtle p-6 lg:border-b-0 lg:border-r">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Largest exposure
                </p>

                {largestPosition ? (
                  <>
                    <div className="mt-5 flex items-end justify-between gap-4">
                      <div>
                        <p className="font-mono text-3xl font-semibold tracking-[-0.04em] text-foreground">
                          {largestPosition.weight.toFixed(
                            1,
                          )}
                          %
                        </p>

                        <p className="mt-2 font-mono text-sm font-semibold text-foreground">
                          {
                            largestPosition
                              .position.symbol
                          }
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[9px] uppercase tracking-[0.12em] text-muted">
                          Market value
                        </p>

                        <p className="mt-1 font-mono text-xs text-muted-strong">
                          {formatMoney(
                            largestPosition
                              .position
                              .marketValue,
                            currency,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 h-2 overflow-hidden rounded-full bg-surface-hover">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{
                          width: `${Math.min(
                            100,
                            largestPosition.weight,
                          )}%`,
                        }}
                      />
                    </div>

                    <p className="mt-3 text-[11px] leading-5 text-muted">
                      The largest currently
                      valued position represents{" "}
                      {largestPosition.weight.toFixed(
                        1,
                      )}
                      % of portfolio market
                      value.
                    </p>
                  </>
                ) : (
                  <p className="mt-4 text-xs text-muted">
                    Allocation cannot be calculated
                    until market values are
                    available.
                  </p>
                )}
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {allocation
                    .slice(0, 6)
                    .map(
                      ({
                        position,
                        weight,
                      }) => (
                        <div
                          key={`${position.symbol}-${position.marketValue ?? "unvalued"}`}
                          className="group"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-hover font-mono text-[9px] font-semibold text-muted">
                                {position.symbol.slice(
                                  0,
                                  2,
                                )}
                              </span>

                              <span className="truncate font-mono text-xs font-semibold text-foreground">
                                {position.symbol}
                              </span>
                            </div>

                            <span className="shrink-0 font-mono text-xs text-muted-strong">
                              {weight.toFixed(1)}%
                            </span>
                          </div>

                          <div className="mt-2 ml-10 h-1.5 overflow-hidden rounded-full bg-surface-hover">
                            <div
                              className="h-full rounded-full bg-foreground/70 transition-all duration-500 group-hover:bg-accent"
                              style={{
                                width: `${Math.min(
                                  100,
                                  weight,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ),
                    )}

                  {allocation.length > 6 ? (
                    <p className="pt-1 text-[10px] text-muted">
                      Showing the six largest
                      valued positions.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="glass-panel-elevated overflow-hidden rounded-2xl">
            <div className="border-b border-border-subtle px-5 py-5 sm:px-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Portfolio intelligence
              </p>

              <h2 className="mt-1.5 text-base font-semibold text-foreground">
                Risk and allocation signals
              </h2>
            </div>

            <div className="grid gap-px bg-border-subtle sm:grid-cols-2 lg:grid-cols-4">
              <InsightCard
                label="Concentration"
                value={
                  largestPosition
                    ? `${largestPosition.weight.toFixed(
                        1,
                      )}% largest`
                    : "Unavailable"
                }
                description="Largest position weight based on currently available market values."
                status={
                  largestPosition &&
                  largestPosition.weight >= 40
                    ? "warning"
                    : "neutral"
                }
              />

              <InsightCard
                label="Risk Score"
                value={
                  positions.length > 0
                    ? "Available"
                    : "Awaiting positions"
                }
                description="Portfolio-level risk analytics can use these holdings once the quantitative risk engine is connected."
                status={
                  positions.length > 0
                    ? "positive"
                    : "neutral"
                }
              />

              <InsightCard
                label="Diversification"
                value={
                  positions.length > 1
                    ? `${positions.length} holdings`
                    : "Single holding"
                }
                description="The current portfolio contains multiple securities when more than one position is recorded."
                status={
                  positions.length > 1
                    ? "positive"
                    : "warning"
                }
              />

              <InsightCard
                label="P&L Breadth"
                value={`${positivePositions} up · ${negativePositions} down`}
                description="Count of positions with currently available positive or negative unrealized P&L."
                status={
                  positivePositions > 0 &&
                  negativePositions === 0
                    ? "positive"
                    : "neutral"
                }
              />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
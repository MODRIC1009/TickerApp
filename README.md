# TickerApp

A full-stack **global equity intelligence and quantitative analytics platform** built as a TypeScript monorepo. TickerApp combines market-data ingestion, reusable analytics, portfolio intelligence, strategy/backtesting tools, quantitative risk scoring, and a Next.js product experience.

> **Status:** Phase 6 is complete on `main`, with production hardening for search, market-data caching, provider rate limits, portfolio initialization, and regression coverage.

## Product vision

TickerApp is designed to evolve from a ticker lookup tool into a research and decision-support terminal:

- **Discover** instruments across supported exchanges and providers.
- **Understand** price, volume, volatility, risk, and market context.
- **Analyze** portfolios, strategies, drawdowns, returns, and risk-adjusted performance.
- **Research** securities with a dedicated AI/research layer.
- **Explain** quantitative risk through transparent components and drivers.
- **Operate** through a modern web application backed by provider-aware APIs.

This is an analytical decision-support product, **not financial advice**.

---

## Architecture

```text
TickerApp
├── apps/web
│   ├── Next.js application
│   ├── Product UI
│   ├── API routes
│   └── Market-data / risk orchestration
│
├── packages/shared
│   └── Canonical shared types and domain contracts
│
├── packages/market-data
│   ├── Provider abstraction
│   ├── Demo provider
│   ├── Twelve Data provider
│   ├── Instrument normalization / identity
│   ├── Exchange catalog and resolution
│   ├── Historical data validation
│   └── Market-session / trading-calendar utilities
│
├── packages/analytics
│   ├── Returns
│   ├── Statistics
│   ├── Technical indicators
│   ├── Performance metrics
│   ├── Drawdown / Sharpe / Sortino / volatility
│   ├── Strategy signals
│   ├── Backtesting
│   ├── Portfolio analytics
│   └── Quantitative risk engine
│
├── packages/portfolio
│   └── Portfolio-domain functionality
│
└── packages/ai
    └── AI/research integration layer
```

### Data flow

```text
External market-data provider
          │
          ▼
   Market Data Provider
          │
          ▼
 MarketDataService / Registry
          │
          ├───────────────┐
          ▼               ▼
   Next.js API       Analytics Engine
          │               │
          │               ├── returns
          │               ├── indicators
          │               ├── performance
          │               ├── backtests
          │               └── risk
          │
          ▼
      Web Product
```

The application keeps provider-specific behavior behind the market-data abstraction so analytics and UI code do not depend directly on a vendor API.

---

## Current capabilities

### Market data

- Provider abstraction and registry.
- Demo market-data provider for development.
- Twelve Data provider for live/external data when configured.
- Instrument search and canonical instrument identity.
- Quotes and historical OHLCV data.
- Exchange catalog and exchange resolution.
- Market-session status and trading calendars.
- Provider health/status reporting.
- Historical interval and date-range validation.
- Fast local catalog search before consuming provider search quota.
- Search-result normalization and deduplication.
- Short-lived request caching and in-flight request coalescing.
- Stale quote recovery when the external provider is temporarily rate limited.

### Quantitative analytics

Reusable analytics modules cover:

- Simple and cumulative returns.
- Annualized returns.
- Sample variance and standard deviation.
- Covariance and correlation.
- Annualized volatility.
- Sharpe and Sortino ratios.
- Drawdown and maximum drawdown.
- SMA and EMA.
- Momentum and ROC.
- RSI.
- ATR.

### Strategy and backtesting

The analytics package includes a strategy/backtesting layer capable of producing:

- Equity curves.
- Trade records.
- Position sizing.
- Transaction fees.
- Slippage.
- Realized P&L.
- Win rate.
- Profit factor.
- Annualized return.
- Volatility.
- Sharpe / Sortino ratios.
- Maximum drawdown.

Performance statistics are calculated from the **strategy equity curve**, rather than incorrectly treating the underlying asset price as the strategy's performance series.

### Quantitative risk engine

The risk engine combines six weighted components:

| Component | Weight |
|---|---:|
| Systematic risk | 20% |
| Volatility | 22% |
| Drawdown | 20% |
| Liquidity | 13% |
| Tail risk | 15% |
| Price behavior / momentum | 10% |

The engine exposes:

- Risk score from 0–100.
- Five risk groups: Very Stable, Stable, Moderate, Risky, Very Risky.
- Indicative leverage output.
- Confidence score.
- Beta and benchmark correlation.
- 30D / 60D / 90D annualized volatility.
- Downside deviation.
- Maximum and current drawdown.
- Historical 95% VaR and CVaR.
- 30-session momentum.
- Top risk drivers with explanations.
- Component scores, weights, and contributions.

The risk service currently uses approximately one year of daily history and, for supported US instruments, uses **SPY** as the benchmark when benchmark history is available.

Risk outputs are deliberately explainable and include provenance such as provider, quote timestamp, history range, bar count, and benchmark information.

---

## Production hardening

The current `main` branch includes the Phase 6 product implementation plus follow-up hardening based on real runtime behavior:

- Global search prefers the canonical local catalog for known instruments, avoiding unnecessary provider latency and quota consumption.
- Provider search results are normalized and deduplicated before reaching the UI.
- Common exchange identifiers and provider exchange names are mapped to canonical exchange IDs.
- Search requests are cached briefly and concurrent identical requests are coalesced.
- Market-data requests use bounded cache windows and can return stale cached quotes during provider rate limiting when a usable quote already exists.
- Known catalog instruments can be resolved without spending a provider request.
- The default portfolio is initialized for the product workspace instead of producing an avoidable missing-portfolio state.
- Regression tests cover search normalization, provider caching/rate-limit behavior, and core product flows.
- GitHub Actions runs typecheck, lint, tests, and production build on `main`, development branches, and pull requests.

External-provider availability remains an external dependency. If a provider quota is exhausted and no cached data exists, the UI intentionally reports the unavailable-data state rather than fabricating a quote or historical series.

---

## Monorepo commands

Prerequisites:

- Node.js 24+
- npm 11+

Install dependencies:

```bash
npm ci
```

Run the web application:

```bash
npm run dev
```

Run type checking:

```bash
npm run typecheck
```

Run linting:

```bash
npm run lint
```

Run the test suite:

```bash
npm test
```

Create a production build:

```bash
npm run build
```

The repository also runs these checks through GitHub Actions for pushes to `main` and development branches and for pull requests.

---

## Market-data configuration

Development defaults to the demo provider when no provider is configured.

For Twelve Data:

```env
MARKET_DATA_PROVIDER=twelve-data
TWELVE_DATA_API_KEY=your_api_key
```

See `apps/web/.env.example` for the supported application environment variables.

Production intentionally requires an explicit `MARKET_DATA_PROVIDER` configuration rather than silently falling back to demo data.

If Twelve Data is rate limited, TickerApp will use eligible cached data when available. It will not manufacture missing market data; a provider-unavailable state is shown when neither live nor cached data is usable.

---

## API surface

The Next.js application exposes provider-aware market-data endpoints for functionality such as:

- instrument search
- instrument details
- quotes
- historical prices
- exchange listing
- provider status
- market session status
- quantitative risk analysis

API responses use explicit success/error envelopes where appropriate and validate request input before calling external providers.

---

## Testing philosophy

Tests focus on deterministic quantitative behavior and important edge cases, including:

- insufficient observations
- invalid prices
- invalid OHLC relationships
- constant-return Sharpe behavior
- drawdown calculations
- indicator windows
- benchmark correlation and beta
- risk confidence degradation with limited history
- VaR/CVaR availability
- explainable risk-component contributions
- weighted risk-score consistency
- provider response normalization
- exchange resolution
- market-data cache expiry and stale-cache recovery
- search-result deduplication
- portfolio initialization and valuation flows

The goal is to keep the financial calculations deterministic, testable, and independent from the web UI.

---

## Repository history

TickerApp began as a Python/Streamlit ticker analytics project based on a static 1,591-ticker dataset. The project has since been rebuilt into a modular TypeScript monorepo with provider abstraction, reusable quantitative analytics, strategy/backtesting infrastructure, portfolio intelligence, AI/research foundations, and a Next.js product layer.

The old Python application and historical artifacts may remain in repository history for provenance; the TypeScript monorepo is the current product architecture.

---

## Development principles

1. **Provider independence** — analytics must not be coupled to one data vendor.
2. **Deterministic quantitative logic** — financial calculations belong in reusable, testable packages.
3. **Explicit data quality** — insufficient or invalid data should be represented rather than silently fabricated.
4. **Explainability** — risk outputs should expose their drivers and provenance.
5. **Production-safe defaults** — production must not silently use demo data.
6. **API/UI separation** — product components consume domain APIs rather than implementing financial calculations themselves.
7. **Regression protection** — every significant analytics capability should have automated tests.

---

## Disclaimer

TickerApp provides quantitative analytics and decision-support tooling. Risk scores, leverage figures, backtests, forecasts, and other outputs are model-derived estimates and should not be interpreted as guaranteed outcomes, personalized investment advice, or a recommendation to buy or sell a security.

---

## Author

**Nihal** — B.Tech IT Student

GitHub: `MODRIC1009/TickerApp`

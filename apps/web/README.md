# TickerApp Web

The `apps/web` package is the Next.js product application for TickerApp.

## Development

From the repository root:

```bash
npm ci
npm run dev
```

The application runs on the default Next.js development port unless another port is configured.

## Validation

From the repository root:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Environment

Copy the example environment file and configure a market-data provider when live data is required:

```bash
cp apps/web/.env.example apps/web/.env.local
```

The supported provider configuration is documented in the root repository README.

## Architecture

The web application is intentionally thin around quantitative logic:

- `app/` contains the Next.js routes and API handlers.
- `components/` contains product UI components.
- `lib/` contains web-side orchestration such as market-data and risk services.
- `@tickerapp/market-data` owns provider integration.
- `@tickerapp/analytics` owns reusable quantitative calculations.
- `@tickerapp/shared` owns shared domain contracts.

Do not duplicate financial calculations inside React components or API route handlers when the logic belongs in `@tickerapp/analytics`.

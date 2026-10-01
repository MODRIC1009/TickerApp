import {
  createFxService,
  createPortfolioService,
  type FxService,
  type PortfolioService,
} from "@tickerapp/portfolio";

import { getFxConfig } from "./fx-config";

const DEFAULT_PORTFOLIO_ID = "default";
const DEFAULT_PORTFOLIO_NAME = "Default Portfolio";
const DEFAULT_PORTFOLIO_CURRENCY = "USD";
const DEFAULT_PORTFOLIO_CASH = 0;

let portfolioService: PortfolioService | undefined;
let fxService: FxService | undefined;

export function getFxService(): FxService {
  if (!fxService) {
    const config = getFxConfig();

    fxService = createFxService({
      fxProviderId: config.providerId,
      fxFallbackProviderIds:
        config.fallbackProviderIds,
    });
  }

  return fxService;
}

function ensureDefaultPortfolio(
  service: PortfolioService,
): void {
  if (
    service
      .listPortfolios()
      .some(
        (portfolio) =>
          portfolio.id ===
          DEFAULT_PORTFOLIO_ID,
      )
  ) {
    return;
  }

  const now = new Date().toISOString();

  service.createPortfolio({
    id: DEFAULT_PORTFOLIO_ID,
    name: DEFAULT_PORTFOLIO_NAME,
    baseCurrency:
      DEFAULT_PORTFOLIO_CURRENCY,
    cashBalance: DEFAULT_PORTFOLIO_CASH,
    createdAt: now,
    updatedAt: now,
  });
}

export function getPortfolioService(): PortfolioService {
  if (!portfolioService) {
    portfolioService = createPortfolioService({
      fxService: getFxService(),
    });
  }

  ensureDefaultPortfolio(
    portfolioService,
  );

  return portfolioService;
}

export function resetPortfolioService(): void {
  portfolioService = undefined;
  fxService = undefined;
}

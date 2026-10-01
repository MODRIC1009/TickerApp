import {
  createFxService,
  createPortfolioService,
  type FxService,
  type Portfolio,
  type PortfolioService,
} from "@tickerapp/portfolio";

import { getFxConfig } from "./fx-config";

const DEFAULT_PORTFOLIO_ID = "default";

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

function createDefaultPortfolio(
  service: PortfolioService,
): void {
  if (
    service
      .listPortfolios()
      .some(
        (portfolio) =>
          portfolio.id === DEFAULT_PORTFOLIO_ID,
      )
  ) {
    return;
  }

  const now = new Date().toISOString();

  const portfolio: Portfolio = {
    id: DEFAULT_PORTFOLIO_ID,
    name: "Default portfolio",
    baseCurrency: "USD",
    cashBalance: 0,
    createdAt: now,
    updatedAt: now,
  };

  service.createPortfolio(portfolio);
}

export function getPortfolioService(): PortfolioService {
  if (!portfolioService) {
    portfolioService = createPortfolioService({
      fxService: getFxService(),
    });

    createDefaultPortfolio(
      portfolioService,
    );
  }

  return portfolioService;
}

export function resetPortfolioService(): void {
  portfolioService = undefined;
  fxService = undefined;
}

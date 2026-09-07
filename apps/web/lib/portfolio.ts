import {
  createFxService,
  createPortfolioService,
  type FxService,
  type PortfolioService,
} from "@tickerapp/portfolio";

import { getFxConfig } from "./fx-config";

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

export function getPortfolioService(): PortfolioService {
  if (!portfolioService) {
    portfolioService = createPortfolioService({
      fxService: getFxService(),
    });
  }

  return portfolioService;
}

export function resetPortfolioService(): void {
  portfolioService = undefined;
  fxService = undefined;
}
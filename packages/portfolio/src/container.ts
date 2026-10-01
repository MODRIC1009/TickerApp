import { FxService } from "./fx-service";
import { DemoFxProvider } from "./providers/demo-fx-provider";
import { PortfolioService } from "./portfolio-service";

export interface PortfolioContainerOptions {
  fxProviderId?: string;
  fxFallbackProviderIds?: string[];
  fxService?: FxService;
}

export function createFxService(
  options: PortfolioContainerOptions = {},
): FxService {
  const providerId =
    options.fxProviderId?.trim().toLowerCase() ??
    "demo-fx";

  return new FxService({
    providers: {
      [providerId]: new DemoFxProvider(),
    },
    defaultProviderId: providerId,
    fallbackProviderIds:
      options.fxFallbackProviderIds ?? [],
  });
}

export function createPortfolioService(
  options: PortfolioContainerOptions = {},
): PortfolioService {
  return new PortfolioService({
    fxService:
      options.fxService ??
      createFxService(options),
  });
}
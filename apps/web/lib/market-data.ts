import {
  createMarketDataService,
  type MarketDataService,
} from "@tickerapp/market-data";

let marketDataService: MarketDataService | undefined;

export function getMarketDataService(): MarketDataService {
  if (!marketDataService) {
    marketDataService = createMarketDataService({
      twelveDataApiKey: process.env.TWELVE_DATA_API_KEY,
    });
  }

  return marketDataService;
}
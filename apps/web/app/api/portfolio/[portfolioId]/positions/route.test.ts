import { beforeEach, describe, expect, it } from "vitest";

import type { Instrument } from "@tickerapp/shared";
import type { Position } from "@tickerapp/portfolio";

import {
  getPortfolioService,
  resetPortfolioService,
} from "@/lib/portfolio";

import { GET } from "./route";

const instrument: Instrument = {
  symbol: "AAPL",
  name: "Apple Inc.",
  exchangeId: "NASDAQ",
  countryCode: "US",
  currency: "USD",
  assetClass: "equity",
};

describe("portfolio positions API", () => {
  beforeEach(() => {
    resetPortfolioService();

    getPortfolioService().createPortfolio({
      id: "positions-api-test",
      name: "Positions API Test",
      baseCurrency: "USD",
      cashBalance: 10000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const position: Position = {
      portfolioId: "positions-api-test",
      instrument,
      quantity: 10,
      averageCost: 200,
      costBasis: 2000,
      marketPrice: 220,
      marketValue: 2200,
      unrealizedPnl: 200,
      unrealizedPnlPercent: 10,
      updatedAt: new Date().toISOString(),
    };

    getPortfolioService().updatePosition(position);
  });

  it("returns portfolio positions", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/portfolio/positions-api-test/positions",
      ),
      {
        params: Promise.resolve({
          portfolioId: "positions-api-test",
        }),
      },
    );

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.positions).toHaveLength(1);
    expect(body.positions[0].instrument.symbol).toBe("AAPL");
    expect(body.positions[0].marketValue).toBe(2200);
  });

  it("returns 404 for a missing portfolio", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/portfolio/missing-portfolio/positions",
      ),
      {
        params: Promise.resolve({
          portfolioId: "missing-portfolio",
        }),
      },
    );

    expect(response.status).toBe(404);

    const body = await response.json();

    expect(body).toHaveProperty("error");
  });
});
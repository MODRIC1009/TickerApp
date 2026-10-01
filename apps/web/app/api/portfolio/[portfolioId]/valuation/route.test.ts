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

describe("portfolio valuation API", () => {
  beforeEach(() => {
    resetPortfolioService();

    const service = getPortfolioService();

    service.createPortfolio({
      id: "valuation-api-test",
      name: "Valuation API Test",
      baseCurrency: "USD",
      cashBalance: 8000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const position: Position = {
      portfolioId: "valuation-api-test",
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

    service.updatePosition(position);
  });

  it("returns portfolio valuation", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/portfolio/valuation-api-test/valuation",
      ),
      {
        params: Promise.resolve({
          portfolioId: "valuation-api-test",
        }),
      },
    );

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.valuation.portfolioId).toBe(
      "valuation-api-test",
    );
    expect(body.valuation.cashValue).toBe(8000);
    expect(body.valuation.positionsValue).toBe(2200);
    expect(body.valuation.totalValue).toBe(10200);
    expect(body.valuation.totalCostBasis).toBe(2000);
    expect(body.valuation.unrealizedPnl).toBe(200);
    expect(body.valuation.realizedPnl).toBe(0);
    expect(body.valuation.totalPnl).toBe(200);
  });

  it("returns 404 for a missing portfolio", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/portfolio/missing-portfolio/valuation",
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
import { beforeEach, describe, expect, it } from "vitest";

import type { Instrument } from "@tickerapp/shared";

import {
  getPortfolioService,
  resetPortfolioService,
} from "@/lib/portfolio";

import { POST } from "./route";

const apple: Instrument = {
  symbol: "AAPL",
  name: "Apple Inc.",
  exchangeId: "NASDAQ",
  countryCode: "US",
  currency: "USD",
  assetClass: "equity",
};

const nvidia: Instrument = {
  symbol: "NVDA",
  name: "NVIDIA Corporation",
  exchangeId: "NASDAQ",
  countryCode: "US",
  currency: "USD",
  assetClass: "equity",
};

describe("portfolio transactions API", () => {
  beforeEach(() => {
    resetPortfolioService();

    getPortfolioService().createPortfolio({
      id: "transaction-api-test",
      name: "Transaction API Test",
      baseCurrency: "USD",
      cashBalance: 10000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it("records a buy transaction", async () => {
    const request = new Request(
      "http://localhost/api/portfolio/transactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: "transaction-1",
          portfolioId: "transaction-api-test",
          symbol: "AAPL",
          instrument: apple,
          side: "buy",
          quantity: 10,
          price: 200,
          fees: 5,
          executedAt: new Date().toISOString(),
        }),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(201);

    const body = await response.json();

    expect(body.transaction.id).toBe("transaction-1");
    expect(body.transaction.symbol).toBe("AAPL");
    expect(body.transaction.side).toBe("buy");
    expect(body.transaction.instrument).toEqual(apple);
  });

  it("rejects a transaction for a missing portfolio", async () => {
    const request = new Request(
      "http://localhost/api/portfolio/transactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: "transaction-2",
          portfolioId: "missing-portfolio",
          symbol: "AAPL",
          instrument: apple,
          side: "buy",
          quantity: 10,
          price: 200,
          fees: 0,
          executedAt: new Date().toISOString(),
        }),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(404);

    const body = await response.json();

    expect(body).toHaveProperty("error");
  });

  it("rejects a buy when there is insufficient cash", async () => {
    const request = new Request(
      "http://localhost/api/portfolio/transactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: "transaction-3",
          portfolioId: "transaction-api-test",
          symbol: "NVDA",
          instrument: nvidia,
          side: "buy",
          quantity: 100,
          price: 200,
          fees: 0,
          executedAt: new Date().toISOString(),
        }),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(409);

    const body = await response.json();

    expect(body).toHaveProperty("error");
  });
});
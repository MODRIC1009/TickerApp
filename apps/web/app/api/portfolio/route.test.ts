import { describe, expect, it, beforeEach } from "vitest";

import { getPortfolioService } from "@/lib/portfolio";

import { GET, POST } from "./route";

describe("portfolio API", () => {
  beforeEach(() => {
    const service = getPortfolioService();

    for (const portfolio of service.listPortfolios()) {
      // The API singleton is intentionally process-local.
      // Tests use unique portfolio ids to avoid cross-test collisions.
      void portfolio;
    }
  });

  it("lists portfolios", async () => {
    const response = await GET();

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body).toHaveProperty("portfolios");
    expect(Array.isArray(body.portfolios)).toBe(true);
  });

  it("creates a portfolio", async () => {
    const portfolioId = `api-test-${Date.now()}`;

    const request = new Request(
      "http://localhost/api/portfolio",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: portfolioId,
          name: "API Test Portfolio",
          baseCurrency: "USD",
          cashBalance: 10000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(201);

    const body = await response.json();

    expect(body.portfolio.id).toBe(portfolioId);
    expect(body.portfolio.name).toBe("API Test Portfolio");
    expect(body.portfolio.cashBalance).toBe(10000);
  });

  it("rejects an invalid portfolio", async () => {
    const request = new Request(
      "http://localhost/api/portfolio",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: "",
          name: "",
          baseCurrency: "",
          cashBalance: -100,
          createdAt: "",
          updatedAt: "",
        }),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body).toHaveProperty("error");
  });
});
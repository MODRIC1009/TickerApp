import {
  describe,
  expect,
  it,
} from "vitest";

import { POST } from "./route";

const validBody = {
  input: [
    {
      timestamp: "2026-01-01",
      price: 100,
    },
    {
      timestamp: "2026-01-02",
      price: 90,
    },
    {
      timestamp: "2026-01-03",
      price: 80,
    },
    {
      timestamp: "2026-01-04",
      price: 102,
    },
    {
      timestamp: "2026-01-05",
      price: 110,
    },
    {
      timestamp: "2026-01-06",
      price: 80,
    },
    {
      timestamp: "2026-01-07",
      price: 70,
    },
  ],
  config: {
    symbol: "NVDA",
    strategy: {
      id: "test-strategy",
      name: "Test Strategy",
      shortPeriod: 2,
      longPeriod: 3,
      rsiPeriod: 2,
      rsiOversold: 70,
      rsiOverbought: 80,
    },
    initialCapital: 10_000,
    positionSizePercent: 100,
    transactionFeePercent: 0,
    slippagePercent: 0,
  },
};

function createRequest(
  body: unknown,
): Request {
  return new Request(
    "http://localhost/api/analytics/backtest",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(body),
    },
  );
}

describe(
  "POST /api/analytics/backtest",
  () => {
    it("runs a valid backtest", async () => {
      const response =
        await POST(
          createRequest(
            validBody,
          ),
        );

      expect(
        response.status,
      ).toBe(200);

      const body =
        await response.json();

      expect(body.success).toBe(
        true,
      );

      expect(
        body.result,
      ).toBeDefined();

      expect(
        body.result.symbol,
      ).toBe("NVDA");

      expect(
        body.result.summary
          .initialCapital,
      ).toBe(10_000);

      expect(
        body.result.equityCurve,
      ).toHaveLength(7);
    });

    it("rejects a non-object request body", async () => {
      const response =
        await POST(
          createRequest([]),
        );

      expect(
        response.status,
      ).toBe(400);

      const body =
        await response.json();

      expect(body.success).toBe(
        false,
      );

      expect(
        body.error.code,
      ).toBe("invalid_request");
    });

    it("rejects invalid input data", async () => {
      const response =
        await POST(
          createRequest({
            ...validBody,
            input: [
              {
                timestamp:
                  "2026-01-01",
                price: "100",
              },
            ],
          }),
        );

      expect(
        response.status,
      ).toBe(400);

      const body =
        await response.json();

      expect(body.success).toBe(
        false,
      );

      expect(
        body.error.code,
      ).toBe("invalid_request");
    });

    it("returns analytics validation errors", async () => {
      const response =
        await POST(
          createRequest({
            ...validBody,
            config: {
              ...validBody.config,
              initialCapital: 0,
            },
          }),
        );

      expect(
        response.status,
      ).toBe(400);

      const body =
        await response.json();

      expect(body.success).toBe(
        false,
      );

      expect(
        body.error.code,
      ).toBe("invalid_parameter");
    });
  },
);
import { describe, expect, it } from "vitest";

import {
  calculateAnnualizedReturn,
  calculateCumulativeReturn,
  calculateSimpleReturns,
} from "./returns";

describe("returns", () => {
  it("calculates simple returns", () => {
    const result = calculateSimpleReturns([
      {
        timestamp: "2026-01-01T00:00:00.000Z",
        price: 100,
      },
      {
        timestamp: "2026-01-02T00:00:00.000Z",
        price: 110,
      },
      {
        timestamp: "2026-01-03T00:00:00.000Z",
        price: 99,
      },
    ]);

    expect(result).toHaveLength(2);

    expect(result[0].timestamp).toBe(
      "2026-01-02T00:00:00.000Z",
    );
    expect(result[0].value).toBeCloseTo(0.1);

    expect(result[1].timestamp).toBe(
      "2026-01-03T00:00:00.000Z",
    );
    expect(result[1].value).toBeCloseTo(-0.1);
  });

  it("calculates cumulative return", () => {
    expect(
      calculateCumulativeReturn([0.1, -0.1]),
    ).toBeCloseTo(-0.01);
  });

  it("annualizes a return", () => {
    expect(
      calculateAnnualizedReturn(0.1, 252, 252),
    ).toBeCloseTo(0.1);
  });

  it("handles a complete loss", () => {
    expect(
      calculateAnnualizedReturn(-1, 252, 252),
    ).toBe(-1);
  });

  it("rejects insufficient price data", () => {
    expect(() =>
      calculateSimpleReturns([
        {
          timestamp: "2026-01-01T00:00:00.000Z",
          price: 100,
        },
      ]),
    ).toThrow(
      "At least two price observations are required.",
    );
  });

  it("rejects non-positive prices", () => {
    expect(() =>
      calculateSimpleReturns([
        {
          timestamp: "2026-01-01T00:00:00.000Z",
          price: 100,
        },
        {
          timestamp: "2026-01-02T00:00:00.000Z",
          price: 0,
        },
      ]),
    ).toThrow(
      "Prices must be finite and greater than zero.",
    );
  });
});
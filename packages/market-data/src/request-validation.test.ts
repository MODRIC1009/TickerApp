import { describe, expect, it } from "vitest";

import {
  validateDateRange,
  validateHistoricalInterval,
  validateSymbol,
} from "./request-validation";

describe("request validation", () => {
  it("normalizes valid symbols", () => {
    expect(validateSymbol(" aapl ")).toBe("AAPL");
  });

  it("rejects empty symbols", () => {
    expect(() => validateSymbol("   ")).toThrow(
      "Symbol cannot be empty.",
    );
  });

  it("rejects symbols longer than 32 characters", () => {
    expect(() =>
      validateSymbol("A".repeat(33)),
    ).toThrow(
      "Symbol cannot exceed 32 characters.",
    );
  });

  it("validates a date range", () => {
    expect(
      validateDateRange(
        "2026-01-01",
        "2026-01-31",
      ),
    ).toEqual({
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2026-01-31T00:00:00.000Z",
    });
  });

  it("rejects an invalid date range", () => {
    expect(() =>
      validateDateRange(
        "not-a-date",
        "2026-01-31",
      ),
    ).toThrow("Invalid date range.");
  });

  it("rejects reversed dates", () => {
    expect(() =>
      validateDateRange(
        "2026-02-01",
        "2026-01-01",
      ),
    ).toThrow(
      "Start date must be before end date.",
    );
  });

  it("accepts supported historical intervals", () => {
    expect(
      validateHistoricalInterval("1d"),
    ).toBe("1d");

    expect(
      validateHistoricalInterval("5m"),
    ).toBe("5m");
  });

  it("rejects unsupported historical intervals", () => {
    expect(() =>
      validateHistoricalInterval("1w"),
    ).toThrow(
      'Unsupported historical interval "1w".',
    );
  });
});
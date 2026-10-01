import { describe, expect, it } from "vitest";

import {
  calculateATR,
  calculateEMA,
  calculateMomentum,
  calculateROC,
  calculateRSI,
  calculateSMA,
} from "./indicators";

describe("indicators", () => {
  it("calculates SMA", () => {
    expect(
      calculateSMA(
        [10, 20, 30, 40, 50],
        3,
      ),
    ).toEqual([
      null,
      null,
      20,
      30,
      40,
    ]);
  });

  it("calculates EMA", () => {
    const result = calculateEMA(
      [10, 20, 30, 40, 50],
      3,
    );

    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
    expect(result[2]).toBeCloseTo(20);
    expect(result[3]).toBeCloseTo(30);
    expect(result[4]).toBeCloseTo(40);
  });

  it("calculates momentum", () => {
    expect(
      calculateMomentum(
        [10, 12, 15, 20],
        2,
      ),
    ).toEqual([
      null,
      null,
      5,
      8,
    ]);
  });

  it("calculates ROC", () => {
    const result = calculateROC(
      [100, 110, 120],
      2,
    );

    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
    expect(result[2]).toBeCloseTo(20);
  });

  it("returns null ROC when the reference value is zero", () => {
    const result = calculateROC(
      [0, 10, 20],
      2,
    );

    expect(result[2]).toBeNull();
  });

  it("calculates RSI", () => {
    const values = Array.from(
      { length: 16 },
      (_, index) => 100 + index,
    );

    const result = calculateRSI(
      values,
      14,
    );

    expect(result[13]).toBeNull();
    expect(result[14]).toBe(100);
    expect(result[15]).toBe(100);
  });

  it("calculates ATR", () => {
    const values = [
      {
        timestamp: "2026-01-01",
        open: 9,
        high: 11,
        low: 8,
        close: 10,
      },
      {
        timestamp: "2026-01-02",
        open: 10,
        high: 13,
        low: 9,
        close: 12,
      },
      {
        timestamp: "2026-01-03",
        open: 12,
        high: 15,
        low: 11,
        close: 14,
      },
    ];

    const result = calculateATR(
      values,
      2,
    );

    expect(result[0]).toBeNull();
    expect(result[1]).toBeCloseTo(3.5);
    expect(result[2]).toBeCloseTo(3.75);
  });

  it("rejects invalid indicator periods", () => {
    expect(() =>
      calculateSMA([1, 2, 3], 0),
    ).toThrow(
      "Indicator period must be a positive integer.",
    );
  });

  it("rejects invalid OHLC relationships", () => {
    expect(() =>
      calculateATR(
        [
          {
            timestamp: "2026-01-01",
            open: 10,
            high: 8,
            low: 9,
            close: 9,
          },
        ],
        1,
      ),
    ).toThrow(
      "OHLC values must satisfy valid high/low relationships.",
    );
  });
});
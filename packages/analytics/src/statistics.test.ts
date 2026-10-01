import { describe, expect, it } from "vitest";

import {
  correlation,
  covariance,
  mean,
  standardDeviation,
  variance,
} from "./statistics";

describe("statistics", () => {
  it("calculates the mean", () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
  });

  it("calculates sample variance", () => {
    expect(variance([1, 2, 3, 4, 5])).toBe(2.5);
  });

  it("calculates sample standard deviation", () => {
    expect(
      standardDeviation([1, 2, 3, 4, 5]),
    ).toBeCloseTo(Math.sqrt(2.5));
  });

  it("calculates covariance", () => {
    expect(
      covariance([1, 2, 3], [2, 4, 6]),
    ).toBe(2);
  });

  it("calculates correlation", () => {
    expect(
      correlation([1, 2, 3], [2, 4, 6]),
    ).toBeCloseTo(1);
  });

  it("returns zero correlation for constant data", () => {
    expect(
      correlation([1, 1, 1], [2, 4, 6]),
    ).toBe(0);
  });

  it("rejects empty input", () => {
    expect(() => mean([])).toThrow(
      "At least one value is required.",
    );
  });

  it("rejects insufficient variance data", () => {
    expect(() => variance([1])).toThrow(
      "At least two observations are required for sample variance.",
    );
  });
});
// @vitest-environment jsdom

import {
  render,
  screen,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { OHLCVBar } from "@tickerapp/shared";

import { PriceHistoryChart } from "./price-history-chart";

const bars: OHLCVBar[] = [
  {
    timestamp: "2026-01-02T00:00:00.000Z",
    open: 100,
    high: 105,
    low: 98,
    close: 103,
    volume: 1_000_000,
  },
  {
    timestamp: "2026-01-05T00:00:00.000Z",
    open: 103,
    high: 108,
    low: 101,
    close: 107,
    volume: 1_200_000,
  },
];

describe("PriceHistoryChart", () => {
  it("renders the chart container for historical bars", () => {
    const { container } =
      render(
        <PriceHistoryChart
          bars={bars}
        />,
      );

    expect(
      container.querySelector(
        ".recharts-responsive-container",
      ),
    ).toBeTruthy();
  });

  it("renders the empty state when no bars are supplied", () => {
    render(
      <PriceHistoryChart bars={[]} />,
    );

    expect(
      screen.getByText(
        "No historical price data available.",
      ),
    ).toBeTruthy();

    expect(
      screen.getByText(
        "Try again later or select a different instrument.",
      ),
    ).toBeTruthy();
  });
});
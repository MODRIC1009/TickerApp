import { describe, expect, it } from "vitest";

import { DemoFxProvider } from "./demo-fx-provider";

describe("DemoFxProvider", () => {
  it("returns a configured currency pair", async () => {
    const provider = new DemoFxProvider({
      asOf: "2026-09-06T10:00:00.000Z",
    });

    await expect(
      provider.getRate("USD", "EUR"),
    ).resolves.toEqual({
      fromCurrency: "USD",
      toCurrency: "EUR",
      rate: 0.9,
      asOf: "2026-09-06T10:00:00.000Z",
    });
  });

  it("normalizes currency codes", async () => {
    const provider = new DemoFxProvider();

    await expect(
      provider.getRate(" usd ", " eur "),
    ).resolves.toEqual(
      expect.objectContaining({
        fromCurrency: "USD",
        toCurrency: "EUR",
      }),
    );
  });

  it("returns one for same-currency conversion", async () => {
    const provider = new DemoFxProvider();

    await expect(
      provider.getRate("USD", "USD"),
    ).resolves.toEqual(
      expect.objectContaining({
        fromCurrency: "USD",
        toCurrency: "USD",
        rate: 1,
      }),
    );
  });

  it("supports custom rates", async () => {
    const provider = new DemoFxProvider({
      rates: {
        "USD:EUR": 0.95,
      },
    });

    await expect(
      provider.getRate("USD", "EUR"),
    ).resolves.toEqual(
      expect.objectContaining({
        rate: 0.95,
      }),
    );
  });

  it("rejects missing currencies", async () => {
    const provider = new DemoFxProvider();

    await expect(
      provider.getRate("", "EUR"),
    ).rejects.toThrow("Both currencies are required.");

    await expect(
      provider.getRate("USD", ""),
    ).rejects.toThrow("Both currencies are required.");
  });

  it("rejects unsupported currency pairs", async () => {
    const provider = new DemoFxProvider();

    await expect(
      provider.getRate("USD", "XYZ"),
    ).rejects.toThrow(
      "No demo FX rate is available for USD/XYZ.",
    );
  });

  it("rejects invalid configured rates", async () => {
    const provider = new DemoFxProvider({
      rates: {
        "USD:EUR": 0,
      },
    });

    await expect(
      provider.getRate("USD", "EUR"),
    ).rejects.toThrow(
      "No demo FX rate is available for USD/EUR.",
    );
  });
});
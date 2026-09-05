import { describe, expect, it } from "vitest";

import { ExchangeRegistry } from "./exchange-registry";

const exchanges = [
  {
    id: "nasdaq",
    name: "NASDAQ",
    countryCode: "US",
    region: "north-america" as const,
    currency: "USD",
    timezone: "America/New_York",
    regularSession: {
      open: "09:30",
      close: "16:00",
    },
  },
  {
    id: "nse",
    name: "National Stock Exchange of India",
    countryCode: "IN",
    region: "asia-pacific" as const,
    currency: "INR",
    timezone: "Asia/Kolkata",
    regularSession: {
      open: "09:15",
      close: "15:30",
    },
  },
  {
    id: "lse",
    name: "London Stock Exchange",
    countryCode: "GB",
    region: "europe" as const,
    currency: "GBP",
    timezone: "Europe/London",
    regularSession: {
      open: "08:00",
      close: "16:30",
    },
  },
];

describe("ExchangeRegistry", () => {
  it("registers and retrieves exchanges", () => {
    const registry = new ExchangeRegistry(exchanges);

    expect(registry.get("nasdaq").name).toBe(
      "NASDAQ",
    );
    expect(registry.has("nse")).toBe(true);
    expect(registry.list()).toHaveLength(3);
  });

  it("rejects duplicate exchange IDs", () => {
    expect(
      () =>
        new ExchangeRegistry([
          exchanges[0],
          exchanges[0],
        ]),
    ).toThrow(
      'Exchange "nasdaq" is already registered.',
    );
  });

  it("finds exchanges by country", () => {
    const registry = new ExchangeRegistry(exchanges);

    expect(
      registry.findByCountry("in"),
    ).toEqual([exchanges[1]]);
  });

  it("finds exchanges by region", () => {
    const registry = new ExchangeRegistry(exchanges);

    expect(
      registry.findByRegion("europe"),
    ).toEqual([exchanges[2]]);
  });

  it("throws for an unknown exchange", () => {
    const registry = new ExchangeRegistry(exchanges);

    expect(() => registry.get("unknown")).toThrow(
      'Exchange "unknown" is not registered.',
    );
  });
});
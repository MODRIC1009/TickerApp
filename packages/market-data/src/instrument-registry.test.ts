import { describe, expect, it } from "vitest";

import { GLOBAL_INSTRUMENTS } from "./instrument-catalog";
import { InstrumentRegistry } from "./instrument-registry";

describe("InstrumentRegistry", () => {
  it("initializes with the global instrument catalog by default", () => {
    const registry =
      new InstrumentRegistry();

    expect(registry.size()).toBe(
      GLOBAL_INSTRUMENTS.length,
    );

    expect(
      registry.get(
        "US",
        "nasdaq",
        "AAPL",
      ),
    ).toMatchObject({
      symbol: "AAPL",
      name: "Apple Inc.",
      exchangeId: "nasdaq",
      countryCode: "US",
    });
  });

  it("can initialize with a custom instrument set", () => {
    const registry =
      new InstrumentRegistry([
        {
          symbol: "TEST",
          name: "Test Company",
          exchangeId: "nasdaq",
          countryCode: "US",
          currency: "USD",
          assetClass: "equity",
        },
      ]);

    expect(registry.size()).toBe(1);

    expect(
      registry.get(
        "US",
        "nasdaq",
        "TEST",
      ),
    ).toMatchObject({
      symbol: "TEST",
      name: "Test Company",
    });

    expect(
      registry.get(
        "US",
        "nasdaq",
        "AAPL",
      ),
    ).toBeNull();
  });

  it("supports registering a new instrument", () => {
    const registry =
      new InstrumentRegistry([]);

    const instrument = {
      symbol: "TEST",
      name: "Test Company",
      exchangeId: "nasdaq",
      countryCode: "US",
      currency: "USD",
      assetClass:
        "equity" as const,
    };

    registry.register(instrument);

    expect(
      registry.get(
        "US",
        "nasdaq",
        "TEST",
      ),
    ).toEqual(instrument);

    expect(registry.size()).toBe(1);
  });

  it("rejects duplicate instrument identities", () => {
    const registry =
      new InstrumentRegistry([]);

    const instrument = {
      symbol: "TEST",
      name: "Test Company",
      exchangeId: "nasdaq",
      countryCode: "US",
      currency: "USD",
      assetClass:
        "equity" as const,
    };

    registry.register(instrument);

    expect(() =>
      registry.register({
        ...instrument,
        name: "Updated Test Company",
      }),
    ).toThrow(
      'Instrument "US:nasdaq:TEST" is already registered.',
    );
  });

  it("upserts an existing instrument", () => {
    const registry =
      new InstrumentRegistry([]);

    registry.register({
      symbol: "TEST",
      name: "Original Company",
      exchangeId: "nasdaq",
      countryCode: "US",
      currency: "USD",
      assetClass: "equity",
    });

    registry.upsert({
      symbol: "TEST",
      name: "Updated Company",
      exchangeId: "nasdaq",
      countryCode: "US",
      currency: "USD",
      assetClass: "equity",
    });

    expect(
      registry.get(
        "US",
        "nasdaq",
        "TEST",
      )?.name,
    ).toBe("Updated Company");

    expect(registry.size()).toBe(1);
  });

  it("retrieves an instrument by canonical identity", () => {
    const registry =
      new InstrumentRegistry();

    const instrument =
      registry.get(
        "US",
        "nasdaq",
        "AAPL",
      );

    expect(instrument).not.toBeNull();

    expect(
      registry.getByIdentity(
        instrument!,
      ),
    ).toEqual(instrument);
  });

  it("normalizes lookup identity components", () => {
    const registry =
      new InstrumentRegistry();

    const instrument =
      registry.get(
        " us ",
        "NASDAQ",
        " aapl ",
      );

    expect(instrument).toMatchObject({
      symbol: "AAPL",
      exchangeId: "nasdaq",
      countryCode: "US",
    });
  });

  it("finds instruments by symbol", () => {
    const registry =
      new InstrumentRegistry();

    const results =
      registry.findBySymbol(
        " aapl ",
      );

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      symbol: "AAPL",
      countryCode: "US",
      exchangeId: "nasdaq",
    });
  });

  it("finds instruments by country", () => {
    const registry =
      new InstrumentRegistry();

    const results =
      registry.findByCountry(" us ");

    expect(results.length).toBeGreaterThan(
      0,
    );

    expect(
      results.every(
        (instrument) =>
          instrument.countryCode ===
          "US",
      ),
    ).toBe(true);
  });

  it("finds instruments by exchange", () => {
    const registry =
      new InstrumentRegistry();

    const results =
      registry.findByExchange(
        " NASDAQ ",
      );

    expect(results.length).toBeGreaterThan(
      0,
    );

    expect(
      results.every(
        (instrument) =>
          instrument.exchangeId ===
          "nasdaq",
      ),
    ).toBe(true);
  });

  it("finds instruments by country and exchange", () => {
    const registry =
      new InstrumentRegistry();

    const results =
      registry.findByCountryAndExchange(
        " us ",
        " NASDAQ ",
      );

    expect(results.length).toBeGreaterThan(
      0,
    );

    expect(
      results.every(
        (instrument) =>
          instrument.countryCode ===
            "US" &&
          instrument.exchangeId ===
            "nasdaq",
      ),
    ).toBe(true);
  });

  it("lists all registered instruments", () => {
    const registry =
      new InstrumentRegistry([
        {
          symbol: "AAA",
          name: "AAA Company",
          exchangeId: "nasdaq",
          countryCode: "US",
          currency: "USD",
          assetClass: "equity",
        },
        {
          symbol: "BBB",
          name: "BBB Company",
          exchangeId: "nyse",
          countryCode: "US",
          currency: "USD",
          assetClass: "equity",
        },
      ]);

    expect(
      registry.list(),
    ).toHaveLength(2);
  });

  it("clears all registered instruments", () => {
    const registry =
      new InstrumentRegistry();

    expect(
      registry.size(),
    ).toBeGreaterThan(0);

    registry.clear();

    expect(
      registry.size(),
    ).toBe(0);

    expect(
      registry.list(),
    ).toEqual([]);
  });
});
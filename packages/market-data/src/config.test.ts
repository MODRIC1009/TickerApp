import { describe, expect, it } from "vitest";

import { createMarketDataConfig } from "./config";

describe("createMarketDataConfig", () => {
  it("defaults to demo when no provider or API key is configured", () => {
    expect(createMarketDataConfig()).toEqual({
      defaultProviderId: "demo",
      twelveDataApiKey: undefined,
    });
  });

  it("selects Twelve Data when an API key is configured", () => {
    expect(
      createMarketDataConfig({
        twelveDataApiKey: "  test-api-key  ",
      }),
    ).toEqual({
      defaultProviderId: "twelve-data",
      twelveDataApiKey: "test-api-key",
    });
  });

  it("trims the API key", () => {
    expect(
      createMarketDataConfig({
        twelveDataApiKey: "  abc123  ",
      }).twelveDataApiKey,
    ).toBe("abc123");
  });

  it("allows an explicit provider override", () => {
    expect(
      createMarketDataConfig({
        defaultProviderId: "demo",
        twelveDataApiKey: "test-api-key",
      }),
    ).toEqual({
      defaultProviderId: "demo",
      twelveDataApiKey: "test-api-key",
    });
  });

  it("treats a whitespace-only API key as unset", () => {
    expect(
      createMarketDataConfig({
        twelveDataApiKey: "   ",
      }),
    ).toEqual({
      defaultProviderId: "demo",
      twelveDataApiKey: undefined,
    });
  });
});
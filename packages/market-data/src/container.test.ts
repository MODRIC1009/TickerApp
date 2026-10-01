import { describe, expect, it } from "vitest";

import { createMarketDataService } from "./container";

describe("createMarketDataService", () => {
  it("uses the demo provider when no Twelve Data key is configured", () => {
    const service = createMarketDataService();

    expect(service.getDefaultProvider().id).toBe("demo");
    expect(
      service.getProviders().map((provider) => provider.id),
    ).toEqual(["demo"]);
  });

  it("uses the configured default provider when it is registered", () => {
    const service = createMarketDataService({
      defaultProviderId: "demo",
    });

    expect(service.getDefaultProvider().id).toBe("demo");
  });

  it("rejects an unregistered configured provider", () => {
    expect(() =>
      createMarketDataService({
        defaultProviderId: "missing-provider",
      }),
    ).toThrow(
      'Configured market data provider "missing-provider" is not registered.',
    );
  });
});

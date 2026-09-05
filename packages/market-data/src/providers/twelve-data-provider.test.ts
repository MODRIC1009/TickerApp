import { describe, expect, it, vi } from "vitest";

import { TwelveDataProvider } from "./twelve-data-provider";

describe("TwelveDataProvider", () => {
  it("has the expected provider identity and capabilities", () => {
    const provider = new TwelveDataProvider({
      apiKey: "test-api-key",
    });

    expect(provider.id).toBe("twelve-data");
    expect(provider.name).toBe("Twelve Data");

    expect(provider.capabilities).toEqual({
      searchInstruments: true,
      instrumentDetails: true,
      quotes: true,
      historicalPrices: true,
      exchanges: false,
    });
  });

  it("requires an API key", () => {
    expect(
      () =>
        new TwelveDataProvider({
          apiKey: "   ",
        }),
    ).toThrow(
      "Twelve Data API key is required.",
    );
  });

  it("trims the configured API key", () => {
    const provider = new TwelveDataProvider({
      apiKey: "  test-api-key  ",
    });

    expect(provider).toBeInstanceOf(
      TwelveDataProvider,
    );
  });

  it("reports unavailable when the API request cannot be completed", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn(async () => {
      throw new Error("Network failure");
    });

    try {
      const provider = new TwelveDataProvider({
        apiKey: "test-api-key",
      });

      await expect(
        provider.getQuote("AAPL"),
      ).rejects.toMatchObject({
        code: "provider_unavailable",
        providerId: "twelve-data",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("maps rate limiting responses", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn(
      async () =>
        new Response("Too many requests", {
          status: 429,
        }),
    );

    try {
      const provider = new TwelveDataProvider({
        apiKey: "test-api-key",
      });

      await expect(
        provider.getQuote("AAPL"),
      ).rejects.toMatchObject({
        code: "rate_limited",
        providerId: "twelve-data",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("maps provider HTTP errors", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn(
      async () =>
        new Response("Internal server error", {
          status: 500,
          statusText: "Internal Server Error",
        }),
    );

    try {
      const provider = new TwelveDataProvider({
        apiKey: "test-api-key",
      });

      await expect(
        provider.getQuote("AAPL"),
      ).rejects.toMatchObject({
        code: "provider_error",
        providerId: "twelve-data",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("maps API-level errors", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            status: "error",
            code: 401,
            message: "Invalid API key.",
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        ),
    );

    try {
      const provider = new TwelveDataProvider({
        apiKey: "test-api-key",
      });

      await expect(
        provider.getQuote("AAPL"),
      ).rejects.toMatchObject({
        code: "provider_error",
        providerId: "twelve-data",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("reports healthy status when the provider health request succeeds", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            status: "ok",
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        ),
    );

    try {
      const provider = new TwelveDataProvider({
        apiKey: "test-api-key",
      });

      const health =
        await provider.healthCheck();

      expect(health.status).toBe("healthy");
      expect(health.message).toBe(
        "Twelve Data API is reachable.",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("reports unavailable status when the health request fails", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn(async () => {
      throw new Error("Network failure");
    });

    try {
      const provider = new TwelveDataProvider({
        apiKey: "test-api-key",
      });

      const health =
        await provider.healthCheck();

      expect(health.status).toBe(
        "unavailable",
      );
      expect(health.message).toBe(
        "Twelve Data API is unreachable.",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
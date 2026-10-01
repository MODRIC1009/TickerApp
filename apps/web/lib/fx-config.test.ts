import { describe, expect, it, vi } from "vitest";

import { getFxConfig } from "./fx-config";

describe("getFxConfig", () => {
  it("uses demo-fx by default", () => {
    vi.stubEnv("FX_PROVIDER", "");
    vi.stubEnv("FX_FALLBACK_PROVIDERS", "");

    expect(getFxConfig()).toEqual({
      providerId: "demo-fx",
      fallbackProviderIds: [],
    });
  });

  it("normalizes the configured provider id", () => {
    vi.stubEnv("FX_PROVIDER", "  DEMO-FX  ");
    vi.stubEnv("FX_FALLBACK_PROVIDERS", "");

    expect(getFxConfig()).toEqual({
      providerId: "demo-fx",
      fallbackProviderIds: [],
    });
  });

  it("parses comma-separated fallback providers", () => {
    vi.stubEnv(
      "FX_PROVIDER",
      "primary",
    );
    vi.stubEnv(
      "FX_FALLBACK_PROVIDERS",
      " fallback-one, FALLBACK-TWO, fallback-three ",
    );

    expect(getFxConfig()).toEqual({
      providerId: "primary",
      fallbackProviderIds: [
        "fallback-one",
        "fallback-two",
        "fallback-three",
      ],
    });
  });

  it("removes empty fallback provider ids", () => {
    vi.stubEnv(
      "FX_PROVIDER",
      "primary",
    );
    vi.stubEnv(
      "FX_FALLBACK_PROVIDERS",
      "fallback-one,, ,fallback-two,",
    );

    expect(getFxConfig()).toEqual({
      providerId: "primary",
      fallbackProviderIds: [
        "fallback-one",
        "fallback-two",
      ],
    });
  });
});
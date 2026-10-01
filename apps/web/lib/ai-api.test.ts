import {
  describe,
  expect,
  it,
} from "vitest";

import {
  AIError,
} from "@tickerapp/ai";

import {
  aiErrorResponse,
  getAIErrorStatus,
} from "./ai-api";

describe("getAIErrorStatus", () => {
  it("maps invalid requests to 400", () => {
    expect(
      getAIErrorStatus(
        new AIError(
          "invalid_request",
          "Invalid request.",
        ),
      ),
    ).toBe(400);
  });

  it("maps unsupported capabilities to 501", () => {
    expect(
      getAIErrorStatus(
        new AIError(
          "unsupported_capability",
          "Unsupported capability.",
        ),
      ),
    ).toBe(501);
  });

  it("maps rate limits to 429", () => {
    expect(
      getAIErrorStatus(
        new AIError(
          "rate_limited",
          "Rate limited.",
        ),
      ),
    ).toBe(429);
  });

  it("maps provider failures to 502", () => {
    expect(
      getAIErrorStatus(
        new AIError(
          "provider_unavailable",
          "Provider unavailable.",
        ),
      ),
    ).toBe(502);

    expect(
      getAIErrorStatus(
        new AIError(
          "provider_error",
          "Provider error.",
        ),
      ),
    ).toBe(502);
  });

  it("maps unknown errors to 502", () => {
    expect(
      getAIErrorStatus(
        new Error("Unexpected error."),
      ),
    ).toBe(502);
  });
});

describe("aiErrorResponse", () => {
  it("returns structured AI error responses", async () => {
    const response =
      aiErrorResponse(
        new AIError(
          "provider_error",
          "Provider failed.",
          {
            providerId: "demo-ai",
          },
        ),
        "Fallback message.",
      );

    expect(response.status).toBe(
      502,
    );

    await expect(
      response.json(),
    ).resolves.toEqual({
      error: "Provider failed.",
      code: "provider_error",
      providerId: "demo-ai",
    });
  });

  it("returns the fallback message for unknown errors", async () => {
    const response =
      aiErrorResponse(
        new Error("Unexpected error."),
        "AI research failed.",
      );

    expect(response.status).toBe(
      502,
    );

    await expect(
      response.json(),
    ).resolves.toEqual({
      error: "AI research failed.",
    });
  });

  it("includes null when an AI error has no provider", async () => {
    const response =
      aiErrorResponse(
        new AIError(
          "invalid_request",
          "Bad request.",
        ),
        "Fallback message.",
      );

    expect(response.status).toBe(
      400,
    );

    await expect(
      response.json(),
    ).resolves.toEqual({
      error: "Bad request.",
      code: "invalid_request",
      providerId: null,
    });
  });
});
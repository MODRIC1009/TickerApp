import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  AIError,
} from "../errors";

import {
  OpenAICompatibleProvider,
} from "./openai-compatible-provider";

const config = {
  id: "openai-compatible",
  name: "OpenAI Compatible",
  model: "test-model",
  baseUrl:
    "https://example.com/v1",
  apiKey: "test-api-key",
};

const input = {
  instrument: {
    symbol: "AAPL",
    name: "Apple Inc.",
    exchangeId: "NASDAQ",
    countryCode: "US",
    currency: "USD",
    assetClass: "equity" as const,
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("OpenAICompatibleProvider", () => {
  it("exposes provider metadata", () => {
    const provider =
      new OpenAICompatibleProvider(
        config,
      );

    expect(provider.id).toBe(
      "openai-compatible",
    );

    expect(provider.name).toBe(
      "OpenAI Compatible",
    );

    expect(provider.model).toBe(
      "test-model",
    );

    expect(
      provider.capabilities.research,
    ).toBe(true);
  });

  it("rejects research when no API key is configured", async () => {
    const provider =
      new OpenAICompatibleProvider({
        ...config,
        apiKey: "",
      });

    await expect(
      provider.research({
        input,
        prompt: "Research AAPL.",
      }),
    ).rejects.toMatchObject({
      code: "provider_unavailable",
      providerId:
        "openai-compatible",
    });
  });

  it("maps network failures to provider_unavailable", async () => {
  vi
    .spyOn(globalThis, "fetch")
    .mockRejectedValue(
      new Error("Network connection failed"),
    );

  const provider =
    new OpenAICompatibleProvider(
      config,
    );

  await expect(
    provider.research({
      input,
      prompt: "Research AAPL.",
    }),
  ).rejects.toMatchObject({
    code: "provider_unavailable",
    providerId:
      "openai-compatible",
  });
});

it("passes an abort signal to fetch and supports a custom timeout", async () => {
  const fetchMock =
    vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(
        async (
          _input,
          init,
        ) => {
          expect(
            init?.signal,
          ).toBeInstanceOf(
            AbortSignal,
          );

          return new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content:
                      JSON.stringify({
                        thesis:
                          "Test thesis.",
                        bullCase: [
                          "Test bull case",
                        ],
                        bearCase: [
                          "Test bear case",
                        ],
                        catalysts: [
                          "Test catalyst",
                        ],
                        risks: [
                          "Test risk",
                        ],
                        sections: [
                          {
                            title:
                              "Test Section",
                            summary:
                              "Test summary.",
                            keyPoints: [
                              "Test point",
                            ],
                          },
                        ],
                        evidence: [
                          {
                            source:
                              "Test source",
                            claim:
                              "Test claim",
                            relevance:
                              "high",
                          },
                        ],
                        confidence:
                          "low",
                        limitations: [
                          "Test limitation",
                        ],
                      }),
                  },
                },
              ],
            }),
            {
              status: 200,
              headers: {
                "content-type":
                  "application/json",
              },
            },
          );
        },
      );

  const provider =
    new OpenAICompatibleProvider({
      ...config,
      timeoutMs: 1_000,
    });

  const result =
    await provider.research({
      input,
      prompt: "Research AAPL.",
    });

  expect(
    result.thesis,
  ).toBe("Test thesis.");

  expect(
    fetchMock,
  ).toHaveBeenCalledOnce();
});

it("maps an aborted request to provider_unavailable", async () => {
  vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(
      async (
        _input,
        init,
      ) => {
        return new Promise<
          Response
        >((_, reject) => {
          const signal =
            init?.signal;

          if (!signal) {
            reject(
              new Error(
                "Abort signal was not provided.",
              ),
            );

            return;
          }

          signal.addEventListener(
            "abort",
            () => {
              reject(
                new DOMException(
                  "The operation was aborted.",
                  "AbortError",
                ),
              );
            },
            {
              once: true,
            },
          );
        });
      },
    );

  const provider =
    new OpenAICompatibleProvider({
      ...config,
      timeoutMs: 5,
    });

  await expect(
    provider.research({
      input,
      prompt: "Research AAPL.",
    }),
  ).rejects.toMatchObject({
    code: "provider_unavailable",
    providerId:
      "openai-compatible",
  });
});

  it("sends the generated prompt to the chat completions endpoint", async () => {
    const fetchMock =
      vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content:
                      JSON.stringify({
                        thesis:
                          "Apple has a strong business profile.",
                        bullCase: [
                          "Strong ecosystem",
                        ],
                        bearCase: [
                          "Valuation risk",
                        ],
                        catalysts: [
                          "Earnings growth",
                        ],
                        risks: [
                          "Market risk",
                        ],
                        sections: [
                          {
                            title:
                              "Financial Quality",
                            summary:
                              "Strong financial profile.",
                            keyPoints: [
                              "Healthy profitability",
                            ],
                          },
                        ],
                        evidence: [
                          {
                            source:
                              "TickerApp supplied market data",
                            claim:
                              "Research uses supplied data.",
                            relevance: "high",
                          },
                        ],
                        confidence: "low",
                        limitations: [
                          "Limited supplied data",
                        ],
                      }),
                  },
                },
              ],
            }),
            {
              status: 200,
              headers: {
                "content-type":
                  "application/json",
              },
            },
          ),
        );

    const provider =
      new OpenAICompatibleProvider(
        config,
      );

    const result =
      await provider.research({
        input,
        prompt:
          "Research AAPL thoroughly.",
      });

    expect(result.instrument.symbol).toBe(
      "AAPL",
    );

    expect(result.thesis).toBe(
      "Apple has a strong business profile.",
    );

    expect(result.bullCase).toEqual([
      "Strong ecosystem",
    ]);

    expect(result.providerId).toBe(
      "openai-compatible",
    );

    expect(result.model).toBe(
      "test-model",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: {
          "content-type":
            "application/json",
          authorization:
            "Bearer test-api-key",
        },
        body: JSON.stringify({
          model: "test-model",
          messages: [
            {
              role: "user",
              content:
                "Research AAPL thoroughly.",
            },
          ],
        }),
      }),
    );
  });

  it("maps HTTP 429 to rate_limited", async () => {
    vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "rate limited",
          }),
          {
            status: 429,
          },
        ),
      );

    const provider =
      new OpenAICompatibleProvider(
        config,
      );

    await expect(
      provider.research({
        input,
        prompt: "Research AAPL.",
      }),
    ).rejects.toMatchObject({
      code: "rate_limited",
      providerId:
        "openai-compatible",
    });
  });

  it("maps other HTTP failures to provider_error", async () => {
    vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "server error",
          }),
          {
            status: 500,
          },
        ),
      );

    const provider =
      new OpenAICompatibleProvider(
        config,
      );

    await expect(
      provider.research({
        input,
        prompt: "Research AAPL.",
      }),
    ).rejects.toMatchObject({
      code: "provider_error",
      providerId:
        "openai-compatible",
    });
  });

  it("rejects an empty model response", async () => {
    vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: "   ",
                },
              },
            ],
          }),
          {
            status: 200,
          },
        ),
      );

    const provider =
      new OpenAICompatibleProvider(
        config,
      );

    await expect(
      provider.research({
        input,
        prompt: "Research AAPL.",
      }),
    ).rejects.toMatchObject({
      code: "provider_error",
      providerId:
        "openai-compatible",
    });
  });

  it("rejects invalid JSON model output", async () => {
    vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content:
                    "This is not valid JSON.",
                },
              },
            ],
          }),
          {
            status: 200,
          },
        ),
      );

    const provider =
      new OpenAICompatibleProvider(
        config,
      );

    await expect(
      provider.research({
        input,
        prompt: "Research AAPL.",
      }),
    ).rejects.toMatchObject({
      code: "provider_error",
      providerId:
        "openai-compatible",
    });
  });

  it("rejects structurally invalid JSON model output", async () => {
    vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content:
                    JSON.stringify({
                      thesis: "",
                      bullCase: [],
                      bearCase: [],
                      catalysts: [],
                      risks: [],
                      sections: [],
                      evidence: [],
                      confidence: "low",
                      limitations: [],
                    }),
                },
              },
            ],
          }),
          {
            status: 200,
          },
        ),
      );

    const provider =
      new OpenAICompatibleProvider(
        config,
      );

    await expect(
      provider.research({
        input,
        prompt: "Research AAPL.",
      }),
    ).rejects.toMatchObject({
      code: "provider_error",
      providerId:
        "openai-compatible",
    });
  });

  it("reports unavailable health without an API key", async () => {
    const provider =
      new OpenAICompatibleProvider({
        ...config,
        apiKey: "",
      });

    const health =
      await provider.healthCheck();

    expect(health.status).toBe(
      "unavailable",
    );

    expect(
      health.message,
    ).toContain(
      "API key is not configured",
    );
  });

  it("reports healthy configuration when an API key is present", async () => {
    const provider =
      new OpenAICompatibleProvider(
        config,
      );

    const health =
      await provider.healthCheck();

    expect(health.status).toBe(
      "healthy",
    );

    expect(
      health.message,
    ).toContain(
      "configuration is present",
    );
  });

  it("normalizes a trailing slash in the base URL", async () => {
    const fetchMock =
      vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: "",
                  },
                },
              ],
            }),
            {
              status: 200,
            },
          ),
        );

    const provider =
      new OpenAICompatibleProvider({
        ...config,
        baseUrl:
          "https://example.com/v1/",
      });

    await expect(
      provider.research({
        input,
        prompt: "Research AAPL.",
      }),
    ).rejects.toBeInstanceOf(
      AIError,
    );

    expect(
      fetchMock.mock.calls[0]?.[0],
    ).toBe(
      "https://example.com/v1/chat/completions",
    );
  });
});
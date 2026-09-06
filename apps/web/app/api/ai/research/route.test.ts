import {
  describe,
  expect,
  it,
} from "vitest";

import {
  POST,
} from "./route";

function createRequest(
  body: unknown,
): Request {
  return new Request(
    "http://localhost/api/ai/research",
    {
      method: "POST",
      headers: {
        "content-type":
          "application/json",
      },
      body: JSON.stringify(body),
    },
  );
}

const instrument = {
  symbol: "AAPL",
  name: "Apple Inc.",
  exchangeId: "NASDAQ",
  countryCode: "US",
  currency: "USD",
  assetClass: "equity" as const,
};

describe("POST /api/ai/research", () => {
  it("returns structured research", async () => {
    const response = await POST(
      createRequest({
        instrument,
        question:
          "What should I research about this company?",
      }) as never,
    );

    expect(response.status).toBe(
      200,
    );

    const body =
      await response.json();

    expect(body.data).toBeDefined();
    expect(
      body.data.instrument.symbol,
    ).toBe("AAPL");
    expect(
      body.data.providerId,
    ).toBe("demo-ai");
    expect(
      body.data.thesis,
    ).toBeTruthy();
  });

  it("accepts quote data", async () => {
    const response = await POST(
      createRequest({
        instrument,
        quote: {
          price: 200,
          change: 2,
          changePercent: 1,
          volume: 1000000,
          marketCap:
            3000000000000,
          timestamp:
            "2026-09-06T10:00:00.000Z",
        },
      }) as never,
    );

    expect(response.status).toBe(
      200,
    );

    const body =
      await response.json();

    expect(
      body.data.sections
        .find(
          (section: {
            title: string;
          }) =>
            section.title ===
            "Market Context",
        )
        ?.summary,
    ).toContain("200");
  });

  it("returns 400 when the instrument is missing", async () => {
    const response = await POST(
      createRequest({
        question:
          "Research this company.",
      }) as never,
    );

    expect(response.status).toBe(
      400,
    );

    await expect(
      response.json(),
    ).resolves.toEqual({
      error:
        "Research instrument is required.",
      code: "invalid_request",
      providerId: null,
    });
  });

  it("returns 400 for an empty research question", async () => {
    const response = await POST(
      createRequest({
        instrument,
        question: "   ",
      }) as never,
    );

    expect(response.status).toBe(
      400,
    );

    await expect(
      response.json(),
    ).resolves.toEqual({
      error:
        "Research question cannot be empty when provided.",
      code: "invalid_request",
      providerId: null,
    });
  });
});
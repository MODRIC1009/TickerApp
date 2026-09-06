import {
  describe,
  expect,
  it,
} from "vitest";

import {
  AIError,
} from "./errors";

import {
  validateResearchRequest,
} from "./request-validation";

const validInstrument = {
  symbol: "AAPL",
  name: "Apple Inc.",
  exchangeId: "NASDAQ",
  countryCode: "US",
  currency: "USD",
  assetClass: "equity",
};

describe("validateResearchRequest", () => {
  it("accepts a valid research request", () => {
    const result =
      validateResearchRequest({
        instrument:
          validInstrument,
        question:
          "Assess the major risks.",
      });

    expect(
      result.instrument,
    ).toEqual(validInstrument);

    expect(result.question).toBe(
      "Assess the major risks.",
    );
  });

  it("trims the research question", () => {
    const result =
      validateResearchRequest({
        instrument:
          validInstrument,
        question:
          "  What are the catalysts?  ",
      });

    expect(result.question).toBe(
      "What are the catalysts?",
    );
  });

  it("rejects a non-object request", () => {
    expect(() =>
      validateResearchRequest(
        null,
      ),
    ).toThrow(AIError);

    expect(() =>
      validateResearchRequest(
        "invalid",
      ),
    ).toThrow(AIError);
  });

  it("rejects a missing instrument", () => {
    expect(() =>
      validateResearchRequest({}),
    ).toThrow(
      "Research instrument is required.",
    );
  });

  it("rejects a missing symbol", () => {
    expect(() =>
      validateResearchRequest({
        instrument: {
          ...validInstrument,
          symbol: " ",
        },
      }),
    ).toThrow(
      "Research instrument symbol is required.",
    );
  });

  it("rejects a missing instrument name", () => {
    expect(() =>
      validateResearchRequest({
        instrument: {
          ...validInstrument,
          name: "",
        },
      }),
    ).toThrow(
      "Research instrument name is required.",
    );
  });

  it("rejects a missing exchange", () => {
    expect(() =>
      validateResearchRequest({
        instrument: {
          ...validInstrument,
          exchangeId: "",
        },
      }),
    ).toThrow(
      "Research instrument exchange is required.",
    );
  });

  it("rejects a missing country", () => {
    expect(() =>
      validateResearchRequest({
        instrument: {
          ...validInstrument,
          countryCode: "",
        },
      }),
    ).toThrow(
      "Research instrument country is required.",
    );
  });

  it("rejects a missing currency", () => {
    expect(() =>
      validateResearchRequest({
        instrument: {
          ...validInstrument,
          currency: "",
        },
      }),
    ).toThrow(
      "Research instrument currency is required.",
    );
  });

  it("rejects an invalid asset class", () => {
    expect(() =>
      validateResearchRequest({
        instrument: {
          ...validInstrument,
          assetClass: "crypto",
        },
      }),
    ).toThrow(
      "Research instrument asset class is invalid.",
    );
  });

  it("rejects a blank question", () => {
    expect(() =>
      validateResearchRequest({
        instrument:
          validInstrument,
        question: "   ",
      }),
    ).toThrow(
      "Research question cannot be empty when provided.",
    );
  });

  it("accepts a request without a question", () => {
    const result =
      validateResearchRequest({
        instrument:
          validInstrument,
      });

    expect(
      result.question,
    ).toBeUndefined();
  });

  it("preserves optional quote and metrics", () => {
    const quote = {
      price: 200,
      change: 2,
      changePercent: 1,
      volume: 1000000,
      timestamp:
        "2026-09-06T10:00:00.000Z",
    };

    const metrics = {
      valuation: {},
      profitability: {},
      growth: {},
      balanceSheet: {},
      cashFlow: {},
      technical: {},
      risk: {},
      ownership: {},
      earnings: {},
      relative: {},
      factorScores: {},
    };

    const result =
      validateResearchRequest({
        instrument:
          validInstrument,
        quote,
        metrics,
      });

    expect(result.quote).toEqual(
      quote,
    );

    expect(result.metrics).toEqual(
      metrics,
    );
  });

  it("rejects a malformed quote", () => {
  expect(() =>
    validateResearchRequest({
      instrument: validInstrument,
      quote: {
        price: "invalid",
      },
    }),
  ).toThrowError(
    expect.objectContaining({
      code: "invalid_request",
      message:
        "Research quote price must be a finite number.",
    }),
  );
});

it("rejects a malformed quote timestamp", () => {
  expect(() =>
    validateResearchRequest({
      instrument: validInstrument,
      quote: {
        price: 100,
        change: 1,
        changePercent: 1,
        volume: 1000,
        timestamp: "",
      },
    }),
  ).toThrowError(
    expect.objectContaining({
      code: "invalid_request",
      message:
        "Research quote timestamp is required.",
    }),
  );
});

it("rejects non-object metrics", () => {
  expect(() =>
    validateResearchRequest({
      instrument: validInstrument,
      metrics: "invalid",
    }),
  ).toThrowError(
    expect.objectContaining({
      code: "invalid_request",
      message:
        "Research metrics must be an object when provided.",
    }),
  );
});

it("accepts a valid quote and metrics", () => {
  const result =
    validateResearchRequest({
      instrument: validInstrument,
      quote: {
        price: 100,
        change: 2,
        changePercent: 2,
        volume: 10000,
        marketCap: 1_000_000,
        timestamp:
          "2026-09-06T10:00:00Z",
      },
      metrics: {
        peRatio: 20,
      },
    });

  expect(result.quote).toEqual({
    price: 100,
    change: 2,
    changePercent: 2,
    volume: 10000,
    marketCap: 1_000_000,
    timestamp:
      "2026-09-06T10:00:00Z",
  });

  expect(result.metrics).toEqual({
    peRatio: 20,
  });
});
});
import {
  AIError,
} from "./errors";

import type {
  ResearchInput,
} from "./types";

function validateQuote(
  value: unknown,
): ResearchInput["quote"] {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value !== "object" ||
    value === null
  ) {
    throw new AIError(
      "invalid_request",
      "Research quote must be an object when provided.",
    );
  }

  const quote =
    value as Record<string, unknown>;

  if (
    typeof quote.price !== "number" ||
    !Number.isFinite(quote.price)
  ) {
    throw new AIError(
      "invalid_request",
      "Research quote price must be a finite number.",
    );
  }

  if (
    typeof quote.change !== "number" ||
    !Number.isFinite(quote.change)
  ) {
    throw new AIError(
      "invalid_request",
      "Research quote change must be a finite number.",
    );
  }

  if (
    typeof quote.changePercent !== "number" ||
    !Number.isFinite(quote.changePercent)
  ) {
    throw new AIError(
      "invalid_request",
      "Research quote change percent must be a finite number.",
    );
  }

  if (
    typeof quote.volume !== "number" ||
    !Number.isFinite(quote.volume)
  ) {
    throw new AIError(
      "invalid_request",
      "Research quote volume must be a finite number.",
    );
  }

  if (
    quote.marketCap !== undefined &&
    (
      typeof quote.marketCap !== "number" ||
      !Number.isFinite(quote.marketCap)
    )
  ) {
    throw new AIError(
      "invalid_request",
      "Research quote market cap must be a finite number when provided.",
    );
  }

  if (
    typeof quote.timestamp !== "string" ||
    !quote.timestamp.trim()
  ) {
    throw new AIError(
      "invalid_request",
      "Research quote timestamp is required.",
    );
  }

  return quote as unknown as ResearchInput["quote"];
}

function validateMetrics(
  value: unknown,
): ResearchInput["metrics"] {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value !== "object" ||
    value === null
  ) {
    throw new AIError(
      "invalid_request",
      "Research metrics must be an object when provided.",
    );
  }

  return value as ResearchInput["metrics"];
}

export function validateResearchRequest(
  input: unknown,
): ResearchInput {
  if (
    typeof input !== "object" ||
    input === null
  ) {
    throw new AIError(
      "invalid_request",
      "Research request must be an object.",
    );
  }

  const request =
    input as Record<string, unknown>;

  if (
    typeof request.instrument !==
      "object" ||
    request.instrument === null
  ) {
    throw new AIError(
      "invalid_request",
      "Research instrument is required.",
    );
  }

  const instrument =
    request.instrument as Record<
      string,
      unknown
    >;

  if (
    typeof instrument.symbol !==
      "string" ||
    !instrument.symbol.trim()
  ) {
    throw new AIError(
      "invalid_request",
      "Research instrument symbol is required.",
    );
  }

  if (
    typeof instrument.name !==
      "string" ||
    !instrument.name.trim()
  ) {
    throw new AIError(
      "invalid_request",
      "Research instrument name is required.",
    );
  }

  if (
    typeof instrument.exchangeId !==
      "string" ||
    !instrument.exchangeId.trim()
  ) {
    throw new AIError(
      "invalid_request",
      "Research instrument exchange is required.",
    );
  }

  if (
    typeof instrument.countryCode !==
      "string" ||
    !instrument.countryCode.trim()
  ) {
    throw new AIError(
      "invalid_request",
      "Research instrument country is required.",
    );
  }

  if (
    typeof instrument.currency !==
      "string" ||
    !instrument.currency.trim()
  ) {
    throw new AIError(
      "invalid_request",
      "Research instrument currency is required.",
    );
  }

  if (
    typeof instrument.assetClass !==
      "string" ||
    ![
      "equity",
      "etf",
      "adr",
      "reit",
      "fund",
    ].includes(
      instrument.assetClass,
    )
  ) {
    throw new AIError(
      "invalid_request",
      "Research instrument asset class is invalid.",
    );
  }

  if (
    request.question !== undefined &&
    (
      typeof request.question !==
        "string" ||
      !request.question.trim()
    )
  ) {
    throw new AIError(
      "invalid_request",
      "Research question cannot be empty when provided.",
    );
  }

    return {
    instrument:
      request.instrument as ResearchInput["instrument"],
    quote:
      validateQuote(request.quote),
    metrics:
      validateMetrics(request.metrics),
    question:
      typeof request.question === "string"
        ? request.question.trim()
        : undefined,
  };
}
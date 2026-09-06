import {
  describe,
  expect,
  it,
} from "vitest";

import {
  AIError,
} from "./errors";

import {
  parseResearchResult,
} from "./research-parser";

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

const validOutput = {
  thesis:
    "Apple has a strong business profile but valuation requires scrutiny.",
  bullCase: [
    "Strong ecosystem.",
    "Potential earnings growth.",
  ],
  bearCase: [
    "Valuation risk.",
    "Competitive pressure.",
  ],
  catalysts: [
    "Earnings growth.",
    "New product launches.",
  ],
  risks: [
    "Macro weakness.",
    "Execution risk.",
  ],
  sections: [
    {
      title: "Financial Quality",
      summary:
        "The business shows strong financial characteristics.",
      keyPoints: [
        "Healthy profitability.",
        "Strong cash generation.",
      ],
    },
  ],
  evidence: [
    {
      source: "TickerApp market data",
      claim:
        "The supplied market data supports the analysis.",
      relevance: "high" as const,
    },
  ],
  confidence: "medium" as const,
  limitations: [
    "External research was not retrieved.",
  ],
};

describe("parseResearchResult", () => {
  it("parses a valid research result", () => {
    const result =
      parseResearchResult(
        validOutput,
        input,
        "test-provider",
        "test-model",
      );

    expect(
      result.instrument,
    ).toEqual(input.instrument);

    expect(result.providerId).toBe(
      "test-provider",
    );

    expect(result.model).toBe(
      "test-model",
    );

    expect(result.thesis).toBe(
      validOutput.thesis,
    );

    expect(result.confidence).toBe(
      "medium",
    );

    expect(result.sections).toHaveLength(
      1,
    );

    expect(result.evidence).toHaveLength(
      1,
    );

    expect(
      result.generatedAt,
    ).toBeTruthy();
  });

  it("trims string fields", () => {
    const result =
      parseResearchResult(
        {
          ...validOutput,
          thesis:
            "  Balanced thesis.  ",
          bullCase: [
            "  Positive factor.  ",
          ],
          sections: [
            {
              title:
                "  Quality  ",
              summary:
                "  Summary.  ",
              keyPoints: [
                "  Point.  ",
              ],
            },
          ],
        },
        input,
        "test-provider",
        "test-model",
      );

    expect(result.thesis).toBe(
      "Balanced thesis.",
    );

    expect(
      result.bullCase,
    ).toEqual([
      "Positive factor.",
    ]);

    expect(
      result.sections[0],
    ).toEqual({
      title: "Quality",
      summary: "Summary.",
      keyPoints: [
        "Point.",
      ],
    });
  });

  it("rejects non-object output", () => {
    expect(() =>
      parseResearchResult(
        null,
        input,
        "test-provider",
        "test-model",
      ),
    ).toThrow(AIError);
  });

  it("rejects a missing thesis", () => {
    expect(() =>
      parseResearchResult(
        {
          ...validOutput,
          thesis: "",
        },
        input,
        "test-provider",
        "test-model",
      ),
    ).toThrow(
      'AI research output field "thesis" is required.',
    );
  });

  it("rejects an empty bull case", () => {
    expect(() =>
      parseResearchResult(
        {
          ...validOutput,
          bullCase: [],
        },
        input,
        "test-provider",
        "test-model",
      ),
    ).toThrow(
      'AI research output field "bullCase" must be a non-empty string array.',
    );
  });

  it("rejects an invalid confidence", () => {
    expect(() =>
      parseResearchResult(
        {
          ...validOutput,
          confidence: "certain",
        },
        input,
        "test-provider",
        "test-model",
      ),
    ).toThrow(
      "AI research output confidence is invalid.",
    );
  });

  it("rejects missing sections", () => {
    expect(() =>
      parseResearchResult(
        {
          ...validOutput,
          sections: undefined,
        },
        input,
        "test-provider",
        "test-model",
      ),
    ).toThrow(
      "AI research output sections must be an array.",
    );
  });

  it("rejects empty sections", () => {
    expect(() =>
      parseResearchResult(
        {
          ...validOutput,
          sections: [],
        },
        input,
        "test-provider",
        "test-model",
      ),
    ).toThrow(
      "AI research output must contain at least one section.",
    );
  });

  it("rejects invalid section objects", () => {
    expect(() =>
      parseResearchResult(
        {
          ...validOutput,
          sections: [
            {
              title: "",
              summary: "Summary.",
              keyPoints: ["Point."],
            },
          ],
        },
        input,
        "test-provider",
        "test-model",
      ),
    ).toThrow(
      'AI research output field "sections[0].title" is required.',
    );
  });

  it("rejects missing evidence", () => {
    expect(() =>
      parseResearchResult(
        {
          ...validOutput,
          evidence: undefined,
        },
        input,
        "test-provider",
        "test-model",
      ),
    ).toThrow(
      "AI research evidence must be an array.",
    );
  });

  it("rejects invalid evidence relevance", () => {
    expect(() =>
      parseResearchResult(
        {
          ...validOutput,
          evidence: [
            {
              source: "Source",
              claim: "Claim",
              relevance: "certain",
            },
          ],
        },
        input,
        "test-provider",
        "test-model",
      ),
    ).toThrow(
      "AI research evidence relevance is invalid.",
    );
  });

  it("rejects empty limitations", () => {
    expect(() =>
      parseResearchResult(
        {
          ...validOutput,
          limitations: [],
        },
        input,
        "test-provider",
        "test-model",
      ),
    ).toThrow(
      'AI research output field "limitations" must be a non-empty string array.',
    );
  });
});
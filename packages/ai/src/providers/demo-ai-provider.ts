import type {
  AIProviderHealth,
  AIResearchProvider,
  AIResearchRequest,
  ResearchResult,
} from "../types";

export class DemoAIProvider
  implements AIResearchProvider
{
  readonly id = "demo-ai";

  readonly name =
    "TickerApp Demo AI";

  readonly model =
    "deterministic-research-v1";

  readonly capabilities = {
    research: true,
  } as const;

  async research(
  request: AIResearchRequest,
): Promise<ResearchResult> {
  const {
  input,
  prompt,
} = request;

if (!prompt.trim()) {
  throw new Error(
    "Research prompt cannot be empty.",
  );
}
    const instrument =
      input.instrument;

    const question =
      input.question?.trim() ||
      "Provide a balanced research overview.";

    const price =
      input.quote?.price;

    const marketCap =
      input.quote?.marketCap;
    
    return {
      instrument,
      generatedAt:
        new Date().toISOString(),
      providerId: this.id,
      model: this.model,
      thesis:
        `${instrument.name} (${instrument.symbol}) requires a balanced assessment of financial quality, valuation, growth, risk, and market context. This demo result is deterministic and is not a prediction or investment recommendation.`,
      bullCase: [
        "Improving financial quality or growth could support a stronger fundamental outlook.",
        "Positive business catalysts could improve future earnings expectations.",
        "Favorable market or sector conditions could support relative performance.",
      ],
      bearCase: [
        "Weakening financial performance could reduce the fundamental outlook.",
        "Elevated valuation could increase downside sensitivity.",
        "Adverse market, sector, or company-specific developments could pressure returns.",
      ],
      catalysts: [
        "Upcoming earnings and management guidance.",
        "Changes in revenue or profitability trends.",
        "Material company, industry, or regulatory developments.",
      ],
      risks: [
        "Market and macroeconomic risk.",
        "Company-specific execution risk.",
        "Valuation and liquidity risk.",
        "Incomplete or stale data.",
      ],
      sections: [
        {
          title: "Financial Quality",
          summary:
            input.metrics
              ? "Financial metrics were supplied for analysis."
              : "Financial metrics were not supplied.",
          keyPoints: [
            input.metrics
              ? "Use the supplied profitability, growth, balance-sheet, and cash-flow metrics for deeper analysis."
              : "Financial quality cannot be fully assessed without financial metrics.",
          ],
        },
        {
          title: "Valuation",
          summary:
            "Valuation should be assessed using multiple complementary measures rather than a single ratio.",
          keyPoints: [
            "Compare valuation against historical ranges and relevant peers.",
            "Consider growth expectations when interpreting valuation multiples.",
          ],
        },
        {
          title: "Market Context",
          summary:
            price !== undefined
              ? `The supplied quote reports a price of ${price}.`
              : "Current quote data was not supplied.",
          keyPoints: [
            marketCap !== undefined
              ? `The supplied market capitalization is ${marketCap}.`
              : "Market capitalization is unavailable.",
            "Technical and market context should be interpreted alongside fundamentals.",
          ],
        },
        {
          title: "Research Question",
          summary: question,
          keyPoints: [
            "The demo provider does not perform external retrieval or live web research.",
          ],
        },
      ],
      evidence: [
        {
          source: "TickerApp supplied market data",
          claim:
            "The analysis uses only data supplied in the research input.",
          relevance: "high",
        },
      ],
      confidence: "low",
      limitations: [
        "This is a deterministic demo provider, not a generative AI model.",
        "It does not retrieve external news, filings, or analyst research.",
        "It should not be treated as investment advice.",
      ],
    };
  }

  async healthCheck(): Promise<AIProviderHealth> {
    return {
      status: "healthy",
      checkedAt:
        new Date().toISOString(),
      message:
        "Demo AI provider is available locally.",
    };
  }
}
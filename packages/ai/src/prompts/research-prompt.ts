
import type { ResearchInput } from "../types";

export const RESEARCH_PROMPT_VERSION = "1.2.0";

export function buildResearchPrompt(input: ResearchInput): string {
  const { instrument, quote, metrics, question } = input;

  const quoteLines = quote
    ? [
        "Current quote: available",
        `Price: ${quote.price}`,
        `Change: ${quote.change}`,
        `Change percent: ${quote.changePercent}`,
        `Volume: ${quote.volume}`,
        `Market cap: ${quote.marketCap}`,
        `Quote timestamp: ${quote.timestamp}`,
      ]
    : ["Current quote: unavailable"];

  const metricsText = metrics
    ? JSON.stringify(metrics, null, 2)
    : "unavailable";

  const userQuestion =
    question?.trim() || "Provide a balanced research overview.";

  return [
    `Research prompt version: ${RESEARCH_PROMPT_VERSION}`,
    "",
    "ROLE AND OBJECTIVE",
    "You are a careful financial research assistant.",
    "Produce evidence-aware, risk-aware equity research.",
    "Do not claim certainty or guaranteed investment outcomes.",
    "Distinguish supplied facts from interpretation.",
    "If data is missing, explicitly state the limitation.",
    "Never invent current prices, financial figures, citations, or sources.",
    "Be concise. Avoid repetition. Use at most 2 key points per section.",
    "",
    "INSTRUMENT",
    `Instrument: ${instrument.name}`,
    `Symbol: ${instrument.symbol}`,
    `Exchange: ${instrument.exchangeId}`,
    `Country: ${instrument.countryCode}`,
    `Currency: ${instrument.currency}`,
    `Asset class: ${instrument.assetClass}`,
    "",
    "MARKET DATA",
    ...quoteLines,
    "",
    "FINANCIAL METRICS",
    `Financial metrics: ${metricsText}`,
    "",
    "USER QUESTION",
    `User research question: ${userQuestion}`,
    "",
    "REQUIRED ANALYSIS SECTIONS",
    "Cover these areas concisely and only make supported claims:",
    "- Investment thesis",
    "- Bull case",
    "- Bear case",
    "- Catalysts",
    "- Risks",
    "- Financial quality",
    "- Valuation",
    "- Technical and market context",
    "- Relative/peer context",
    "- Data limitations and uncertainty",
    "",
    "OUTPUT CONTRACT",
    "Return exactly one valid JSON object, without Markdown fences.",
    "Include every required field. Do not add unrequested top-level fields.",
    "thesis: non-empty string.",
    "bullCase, bearCase, catalysts, risks, limitations: each a non-empty array of strings.",
    "sections: array of objects with title, summary, and keyPoints.",
    "Each section must have a non-empty title, summary, and non-empty keyPoints string array.",
    "Use concise summaries and no more than 2 key points per section.",
    "evidence: array of objects with source, claim, and relevance.",
    "Use [] for evidence when no source was supplied. Never fabricate sources.",
    'Each evidence relevance and overall confidence must be "high", "medium", or "low".',
    "confidence must be exactly high, medium, or low.",
    "Use the supplied instrument identity and symbol without modification.",
    "",
    "REQUIRED JSON SHAPE",
    JSON.stringify(
      {
        thesis: "A concise, balanced investment thesis.",
        bullCase: ["One qualified potential positive."],
        bearCase: ["One material downside consideration."],
        catalysts: ["One potential event to monitor."],
        risks: ["One material risk and its possible impact."],
        sections: [
          {
            title: "Valuation",
            summary: "What the supplied data supports and what remains unknown.",
            keyPoints: [
              "Do not conclude that the asset is cheap or expensive without supporting data.",
            ],
          },
        ],
        evidence: [],
        confidence: "low",
        limitations: ["Current financial data may be incomplete."],
      },
      null,
      2,
    ),
    "",
    "Return only the completed JSON object.",
  ].join("\n");
}

import type {
  ResearchInput,
} from "../types";

export const RESEARCH_PROMPT_VERSION =
  "1.0.0";

export function buildResearchPrompt(
  input: ResearchInput,
): string {
  const {
    instrument,
    quote,
    metrics,
    question,
  } = input;

  return [
    `Research prompt version: ${RESEARCH_PROMPT_VERSION}`,
    "",
    "You are a financial research assistant.",
    "Produce evidence-aware, risk-aware equity research.",
    "Do not claim certainty or guaranteed investment outcomes.",
    "Distinguish supplied facts from interpretation.",
    "If data is missing, explicitly state the limitation.",
    "",
    `Instrument: ${instrument.name}`,
    `Symbol: ${instrument.symbol}`,
    `Exchange: ${instrument.exchangeId}`,
    `Country: ${instrument.countryCode}`,
    `Currency: ${instrument.currency}`,
    `Asset class: ${instrument.assetClass}`,
    "",
    quote
      ? [
          "Current quote:",
          `Price: ${quote.price}`,
          `Change: ${quote.change}`,
          `Change percent: ${quote.changePercent}`,
          `Volume: ${quote.volume}`,
          quote.marketCap !== undefined
            ? `Market cap: ${quote.marketCap}`
            : "Market cap: unavailable",
          `Timestamp: ${quote.timestamp}`,
        ].join("\n")
      : "Current quote: unavailable",
    "",
    metrics
      ? [
          "Financial metrics:",
          JSON.stringify(
            metrics,
            null,
            2,
          ),
        ].join("\n")
      : "Financial metrics: unavailable",
    "",
    question?.trim()
      ? [
          "User research question:",
          question.trim(),
        ].join("\n")
      : "User research question: Provide a balanced research overview.",
    "",
    "Required analysis:",
    "1. Investment thesis",
    "2. Bull case",
    "3. Bear case",
    "4. Catalysts",
    "5. Risks",
    "6. Financial quality",
    "7. Valuation",
    "8. Technical and market context",
    "9. Relative/peer context",
    "10. Data limitations and uncertainty",
        "",
    "Output requirements:",
    "Return only valid JSON.",
    "Do not use Markdown, code fences, commentary, or explanatory text outside the JSON object.",
    "The JSON object must contain exactly these top-level fields:",
    "instrument, generatedAt, providerId, model, thesis, bullCase, bearCase, catalysts, risks, sections, evidence, confidence, limitations.",
    "bullCase, bearCase, catalysts, risks, and limitations must be arrays of strings.",
    "sections must be an array of objects with title, summary, and keyPoints.",
    "evidence must be an array of objects with source, claim, and relevance.",
    "relevance must be one of: high, medium, low.",
    "confidence must be one of: high, medium, low.",
    "Use the supplied instrument identity exactly.",
    "Do not invent external evidence or sources that were not supplied.",
  ].join("\n");
}

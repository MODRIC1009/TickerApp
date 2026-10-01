import type {
  FinancialMetrics,
  Instrument,
  Quote,
} from "@tickerapp/shared";

export interface ResearchInput {
  instrument: Instrument;
  quote?: Quote;
  metrics?: FinancialMetrics;
  question?: string;
}

export interface ResearchEvidence {
  source: string;
  claim: string;
  relevance: "high" | "medium" | "low";
}

export interface ResearchSection {
  title: string;
  summary: string;
  keyPoints: string[];
}

export interface ResearchResult {
  instrument: Instrument;
  generatedAt: string;
  providerId: string;
  model: string;
  thesis: string;
  bullCase: string[];
  bearCase: string[];
  catalysts: string[];
  risks: string[];
  sections: ResearchSection[];
  evidence: ResearchEvidence[];
  confidence: "high" | "medium" | "low";
  limitations: string[];
}

export interface AIProviderCapabilities {
  research: boolean;
}

export interface AIProviderHealth {
  status: "healthy" | "degraded" | "unavailable";
  checkedAt: string;
  message?: string;
}

export interface AIResearchRequest {
  input: ResearchInput;
  prompt: string;
}

export interface AIResearchProvider {
  readonly id: string;
  readonly name: string;
  readonly model: string;
  readonly capabilities: AIProviderCapabilities;

  research(
  request: AIResearchRequest,
): Promise<ResearchResult>;

  healthCheck(): Promise<AIProviderHealth>;
}

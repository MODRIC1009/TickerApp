import {
  AIError,
} from "./errors";

import type {
  ResearchInput,
  ResearchResult,
} from "./types";

function requireString(
  value: unknown,
  field: string,
  providerId: string,
): string {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new AIError(
      "provider_error",
      `AI research output field "${field}" is required.`,
      {
        providerId,
      },
    );
  }

  return value.trim();
}

function requireStringArray(
  value: unknown,
  field: string,
  providerId: string,
): string[] {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some(
      (item) =>
        typeof item !== "string" ||
        !item.trim(),
    )
  ) {
    throw new AIError(
      "provider_error",
      `AI research output field "${field}" must be a non-empty string array.`,
      {
        providerId,
      },
    );
  }

  return value.map((item) =>
    item.trim(),
  );
}

function requireRelevance(
  value: unknown,
  providerId: string,
): "high" | "medium" | "low" {
  if (
    value !== "high" &&
    value !== "medium" &&
    value !== "low"
  ) {
    throw new AIError(
      "provider_error",
      "AI research evidence relevance is invalid.",
      {
        providerId,
      },
    );
  }

  return value;
}

export function parseResearchResult(
  raw: unknown,
  input: ResearchInput,
  providerId: string,
  model: string,
): ResearchResult {
  if (
    typeof raw !== "object" ||
    raw === null
  ) {
    throw new AIError(
      "provider_error",
      "AI research output must be an object.",
      {
        providerId,
      },
    );
  }

  const output =
    raw as Record<string, unknown>;

  const thesis =
    requireString(
      output.thesis,
      "thesis",
      providerId,
    );

  const bullCase =
    requireStringArray(
      output.bullCase,
      "bullCase",
      providerId,
    );

  const bearCase =
    requireStringArray(
      output.bearCase,
      "bearCase",
      providerId,
    );

  const catalysts =
    requireStringArray(
      output.catalysts,
      "catalysts",
      providerId,
    );

  const risks =
    requireStringArray(
      output.risks,
      "risks",
      providerId,
    );

  const limitations =
    requireStringArray(
      output.limitations,
      "limitations",
      providerId,
    );

  if (
    output.confidence !== "high" &&
    output.confidence !== "medium" &&
    output.confidence !== "low"
  ) {
    throw new AIError(
      "provider_error",
      "AI research output confidence is invalid.",
      {
        providerId,
      },
    );
  }

  if (
    !Array.isArray(
      output.sections,
    )
  ) {
    throw new AIError(
      "provider_error",
      "AI research output sections must be an array.",
      {
        providerId,
      },
    );
  }

  const sections =
    output.sections.map(
      (section, index) => {
        if (
          typeof section !==
            "object" ||
          section === null
        ) {
          throw new AIError(
            "provider_error",
            `AI research section ${index} is invalid.`,
            {
              providerId,
            },
          );
        }

        const value =
          section as Record<
            string,
            unknown
          >;

        return {
          title:
            requireString(
              value.title,
              `sections[${index}].title`,
              providerId,
            ),
          summary:
            requireString(
              value.summary,
              `sections[${index}].summary`,
              providerId,
            ),
          keyPoints:
            requireStringArray(
              value.keyPoints,
              `sections[${index}].keyPoints`,
              providerId,
            ),
        };
      },
    );

  if (
    sections.length === 0
  ) {
    throw new AIError(
      "provider_error",
      "AI research output must contain at least one section.",
      {
        providerId,
      },
    );
  }

  if (
    !Array.isArray(
      output.evidence,
    )
  ) {
    throw new AIError(
      "provider_error",
      "AI research evidence must be an array.",
      {
        providerId,
      },
    );
  }

  const evidence =
    output.evidence.map(
      (item, index) => {
        if (
          typeof item !==
            "object" ||
          item === null
        ) {
          throw new AIError(
            "provider_error",
            `AI research evidence ${index} is invalid.`,
            {
              providerId,
            },
          );
        }

        const value =
          item as Record<
            string,
            unknown
          >;

        return {
          source:
            requireString(
              value.source,
              `evidence[${index}].source`,
              providerId,
            ),
          claim:
            requireString(
              value.claim,
              `evidence[${index}].claim`,
              providerId,
            ),
          relevance:
            requireRelevance(
              value.relevance,
              providerId,
            ),
        };
      },
    );

  return {
    instrument:
      input.instrument,
    generatedAt:
      new Date().toISOString(),
    providerId,
    model,
    thesis,
    bullCase,
    bearCase,
    catalysts,
    risks,
    sections,
    evidence,
    confidence:
      output.confidence,
    limitations,
  };
}
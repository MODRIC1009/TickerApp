import type { Instrument } from "@tickerapp/shared";

export interface InstrumentSearchResult {
  instrument: Instrument;
  score?: number;
}

export interface InstrumentSearchResponse {
  results: InstrumentSearchResult[];
}

export async function searchInstruments(
  query: string,
): Promise<InstrumentSearchResponse> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return { results: [] };
  }

  const response = await fetch(
    `/api/market-data/search?q=${encodeURIComponent(trimmedQuery)}`,
  );

  const payload = (await response.json()) as
    | InstrumentSearchResponse
    | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in payload && payload.error
        ? payload.error
        : "Failed to search instruments.",
    );
  }

  return payload as InstrumentSearchResponse;
}
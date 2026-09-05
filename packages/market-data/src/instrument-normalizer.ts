import type { Instrument } from "@tickerapp/shared";

import { resolveExchange } from "./exchange-resolution";
import { normalizeSymbol } from "./instrument-identity";

export interface ProviderInstrumentInput {
  symbol: string;
  name?: string;
  exchange?: string;
  micCode?: string;
  countryCode?: string;
  currency?: string;
  instrumentType?: string;
}

export function normalizeProviderInstrument(
  providerId: string,
  input: ProviderInstrumentInput,
): Instrument {
  const symbol = normalizeSymbol(input.symbol);
  const providerExchangeId =
    input.micCode?.trim() ||
    input.exchange?.trim();

  const exchangeResolution =
    resolveExchange(providerExchangeId);

  const countryCode =
    exchangeResolution.countryCode ||
    input.countryCode?.trim().toUpperCase() ||
    "";

  return {
    symbol,
    name:
      input.name?.trim() ||
      symbol,
    exchangeId:
      exchangeResolution.exchangeId,
    countryCode,
    currency:
      input.currency?.trim().toUpperCase() ||
      "USD",
    assetClass:
      mapAssetClass(input.instrumentType),
    metadata: {
      source: {
        providerId:
          providerId.trim(),
        providerSymbol:
          input.symbol.trim(),
        providerExchangeId:
          providerExchangeId,
      },
    },
  };
}

export function mapAssetClass(
  instrumentType?: string,
): Instrument["assetClass"] {
  const normalized =
    instrumentType
      ?.trim()
      .toLowerCase();

  if (!normalized) {
    return "equity";
  }

  if (
    normalized.includes("etf") ||
    normalized.includes("exchange traded fund")
  ) {
    return "etf";
  }

  if (
    normalized.includes("adr")
  ) {
    return "adr";
  }

  if (
    normalized.includes("reit")
  ) {
    return "reit";
  }

  if (
    normalized.includes("fund") ||
    normalized.includes("mutual")
  ) {
    return "fund";
  }

  return "equity";
}
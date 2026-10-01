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

const countryAliases: Record<string, string> = {
  UNITEDSTATES: "US",
  USA: "US",
  CANADA: "CA",
  UNITEDKINGDOM: "GB",
  UK: "GB",
  GERMANY: "DE",
  FRANCE: "FR",
  NETHERLANDS: "NL",
  SWITZERLAND: "CH",
  INDIA: "IN",
  JAPAN: "JP",
  HONGKONG: "HK",
  CHINA: "CN",
  SOUTHKOREA: "KR",
  KOREA: "KR",
  TAIWAN: "TW",
  SINGAPORE: "SG",
  AUSTRALIA: "AU",
  BRAZIL: "BR",
  MEXICO: "MX",
  SOUTHAFRICA: "ZA",
};

function normalizeCountryCode(
  value?: string,
): string {
  const normalized =
    value
      ?.trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "") ?? "";

  return countryAliases[normalized] ??
    (normalized.length === 2
      ? normalized
      : "");
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
    normalizeCountryCode(
      input.countryCode,
    );

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

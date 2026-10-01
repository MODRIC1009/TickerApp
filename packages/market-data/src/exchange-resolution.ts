import { GLOBAL_EXCHANGES } from "./exchange-catalog";

export interface ExchangeResolution {
  exchangeId: string;
  countryCode: string;
  confidence: "exact" | "alias" | "unknown";
}

/**
 * Provider exchange identifiers are not consistent across vendors. Keep the
 * canonical application exchange IDs in GLOBAL_EXCHANGES and normalize the
 * common provider names/MICs into those IDs here.
 */
const aliases: Record<string, string> = {
  NASDAQ: "nasdaq",
  NASDAQGS: "nasdaq",
  NASDAQCM: "nasdaq",
  NASDAQGM: "nasdaq",
  XNAS: "nasdaq",
  XNGS: "nasdaq",
  NASDAQGLOBALSELECTMARKET: "nasdaq",
  NASDAQGLOBALMARKET: "nasdaq",
  NASDAQCAPITALMARKET: "nasdaq",
  NASDAQGLOBALSELECT: "nasdaq",
  NASDAQNGSGLOBALSELECTMARKET: "nasdaq",

  NYSE: "nyse",
  XNYS: "nyse",

  TSX: "tsx",
  XTSE: "tsx",

  LSE: "lse",
  XLON: "lse",

  XETRA: "xetra",
  XETR: "xetra",

  EURONEXT: "euronext-paris",
  XPAR: "euronext-paris",
  EURONEXTPARIS: "euronext-paris",

  AMS: "euronext-amsterdam",
  XAMS: "euronext-amsterdam",
  EURONEXTAMSTERDAM: "euronext-amsterdam",

  SIX: "six",
  XSWX: "six",
  SIXSWISSEXCHANGE: "six",

  NSE: "nse",
  XNSE: "nse",
  NATIONALSTOCKEXCHANGEOFINDIA: "nse",

  JPX: "jpx",
  XTKS: "jpx",
  TOKYOSTOCKEXCHANGE: "jpx",

  HKEX: "hkex",
  XHKG: "hkex",

  SSE: "sse",
  XSHG: "sse",

  SZSE: "szse",
  XSHE: "szse",

  KRX: "krx",
  XKRX: "krx",

  TWSE: "twse",
  XTAI: "twse",

  SGX: "sgx",
  XSES: "sgx",

  ASX: "asx",
  XASX: "asx",

  B3: "b3",
  BVMF: "b3",
  XBSP: "b3",

  BMV: "bmv",
  XMEX: "bmv",

  JSE: "jse",
  XJSE: "jse",
};

function normalizeExchangeToken(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function resolveExchange(
  providerExchangeId?: string,
): ExchangeResolution {
  const raw = providerExchangeId?.trim();

  if (!raw) {
    return {
      exchangeId: "unknown",
      countryCode: "",
      confidence: "unknown",
    };
  }

  const normalized = normalizeExchangeToken(raw);

  const exactMatch = GLOBAL_EXCHANGES.find(
    (exchange) =>
      normalizeExchangeToken(exchange.id) === normalized ||
      normalizeExchangeToken(exchange.name) === normalized,
  );

  if (exactMatch) {
    return {
      exchangeId: exactMatch.id,
      countryCode: exactMatch.countryCode,
      confidence: "exact",
    };
  }

  const aliasMatch = aliases[normalized];

  if (aliasMatch) {
    const exchange = GLOBAL_EXCHANGES.find(
      (item) => item.id === aliasMatch,
    );

    if (exchange) {
      return {
        exchangeId: exchange.id,
        countryCode: exchange.countryCode,
        confidence: "alias",
      };
    }
  }

  return {
    exchangeId: "unknown",
    countryCode: "",
    confidence: "unknown",
  };
}

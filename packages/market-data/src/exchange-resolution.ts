import { GLOBAL_EXCHANGES } from "./exchange-catalog";

export interface ExchangeResolution {
  exchangeId: string;
  countryCode: string;
  confidence: "exact" | "alias" | "unknown";
}

const aliases: Record<string, string> = {
  NASDAQ: "nasdaq",
  NASDAQGS: "nasdaq",
  NASDAQCM: "nasdaq",
  NASDAQGM: "nasdaq",
  XNAS: "nasdaq",

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

  AMS: "euronext-amsterdam",
  XAMS: "euronext-amsterdam",

  SIX: "six",
  XSWX: "six",

  NSE: "nse",
  XNSE: "nse",

  JPX: "jpx",
  XTKS: "jpx",

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

export function resolveExchange(
  providerExchangeId?: string,
): ExchangeResolution {
  const normalized =
    providerExchangeId?.trim().toUpperCase();

  if (!normalized) {
    return {
      exchangeId: "unknown",
      countryCode: "",
      confidence: "unknown",
    };
  }

  const exactMatch = GLOBAL_EXCHANGES.find(
    (exchange) =>
      exchange.id.toUpperCase() === normalized,
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
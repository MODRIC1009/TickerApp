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
  NASDAQ GLOBAL SELECT MARKET: "nasdaq",
  NASDAQ GLOBAL MARKET: "nasdaq",
  NASDAQ CAPITAL MARKET: "nasdaq",
  NASDAQ GLOBAL SELECT: "nasdaq",
  NASDAQ GLOBAL MARKET: "nasdaq",
  XNAS: "nasdaq",
  XNGS: "nasdaq",

  NYSE: "nyse",
  NEW YORK STOCK EXCHANGE: "nyse",
  NYSE ARCA: "nyse",
  NYSE AMERICAN: "nyse",
  NYSE MKT: "nyse",
  XNYS: "nyse",

  TSX: "tsx",
  TORONTO STOCK EXCHANGE: "tsx",
  XTSE: "tsx",

  LSE: "lse",
  LONDON STOCK EXCHANGE: "lse",
  XLON: "lse",

  XETRA: "xetra",
  XETR: "xetra",

  EURONEXT: "euronext-paris",
  EURONEXT PARIS: "euronext-paris",
  XPAR: "euronext-paris",

  AMS: "euronext-amsterdam",
  EURONEXT AMSTERDAM: "euronext-amsterdam",
  XAMS: "euronext-amsterdam",

  SIX: "six",
  SIX SWISS EXCHANGE: "six",
  XSWX: "six",

  NSE: "nse",
  NATIONAL STOCK EXCHANGE: "nse",
  XNSE: "nse",

  JPX: "jpx",
  JAPAN EXCHANGE GROUP: "jpx",
  XTKS: "jpx",

  HKEX: "hkex",
  HONG KONG STOCK EXCHANGE: "hkex",
  XHKG: "hkex",

  SSE: "sse",
  SHANGHAI STOCK EXCHANGE: "sse",
  XSHG: "sse",

  SZSE: "szse",
  SHENZHEN STOCK EXCHANGE: "szse",
  XSHE: "szse",

  KRX: "krx",
  KOREA EXCHANGE: "krx",
  XKRX: "krx",

  TWSE: "twse",
  TAIWAN STOCK EXCHANGE: "twse",
  XTAI: "twse",

  SGX: "sgx",
  SINGAPORE EXCHANGE: "sgx",
  XSES: "sgx",

  ASX: "asx",
  AUSTRALIAN SECURITIES EXCHANGE: "asx",
  XASX: "asx",

  B3: "b3",
  BVMF: "b3",
  BRAZILIAN STOCK EXCHANGE: "b3",
  XBSP: "b3",

  BMV: "bmv",
  MEXICAN STOCK EXCHANGE: "bmv",
  XMEX: "bmv",

  JSE: "jse",
  JOHANNESBURG STOCK EXCHANGE: "jse",
  XJSE: "jse",
};

function findExchange(
  exchangeId: string,
): (typeof GLOBAL_EXCHANGES)[number] | undefined {
  return GLOBAL_EXCHANGES.find(
    (exchange) =>
      exchange.id.toUpperCase() ===
      exchangeId.toUpperCase(),
  );
}

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

  const exactMatch =
    findExchange(normalized);

  if (exactMatch) {
    return {
      exchangeId: exactMatch.id,
      countryCode: exactMatch.countryCode,
      confidence: "exact",
    };
  }

  const aliasMatch = aliases[normalized];

  if (aliasMatch) {
    const exchange =
      findExchange(aliasMatch);

    if (exchange) {
      return {
        exchangeId: exchange.id,
        countryCode:
          exchange.countryCode,
        confidence: "alias",
      };
    }
  }

  const substringAlias = Object.entries(
    aliases,
  ).find(([alias]) =>
    normalized.includes(alias),
  );

  if (substringAlias) {
    const exchange = findExchange(
      substringAlias[1],
    );

    if (exchange) {
      return {
        exchangeId: exchange.id,
        countryCode:
          exchange.countryCode,
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

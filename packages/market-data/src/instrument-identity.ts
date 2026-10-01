import type { Instrument } from "@tickerapp/shared";

export interface CanonicalInstrumentIdentity {
  symbol: string;
  exchangeId: string;
  countryCode: string;
}

export function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export function createInstrumentIdentity(
  instrument: Instrument,
): CanonicalInstrumentIdentity {
  return {
    symbol: normalizeSymbol(instrument.symbol),
    exchangeId: instrument.exchangeId.trim().toLowerCase(),
    countryCode: instrument.countryCode.trim().toUpperCase(),
  };
}

export function getInstrumentIdentityKey(
  instrument: Instrument,
): string {
  const identity = createInstrumentIdentity(instrument);

  return [
    identity.countryCode,
    identity.exchangeId,
    identity.symbol,
  ].join(":");
}
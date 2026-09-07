import type { Instrument } from "@tickerapp/shared";

export function getInstrumentIdentity(
  instrument: Instrument,
): string {
  const providerExchangeId =
    instrument.metadata?.source?.providerExchangeId ?? "";

  return [
    instrument.countryCode.trim().toUpperCase(),
    instrument.exchangeId.trim().toLowerCase(),
    instrument.symbol.trim().toUpperCase(),
    instrument.currency.trim().toUpperCase(),
    providerExchangeId.trim().toUpperCase(),
  ].join(":");
}

export function getTransactionIdentity(
  symbol: string,
  instrument: Instrument,
): string {
  return getInstrumentIdentity({
    ...instrument,
    symbol,
  });
}
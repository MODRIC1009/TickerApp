import type { Instrument } from "@tickerapp/shared";

import { getInstrumentIdentityKey } from "./instrument-identity";

export class InstrumentRegistry {
  private readonly instruments = new Map<string, Instrument>();

  register(instrument: Instrument): void {
    const key = getInstrumentIdentityKey(instrument);

    if (this.instruments.has(key)) {
      throw new Error(
        `Instrument "${key}" is already registered.`,
      );
    }

    this.instruments.set(key, instrument);
  }

  upsert(instrument: Instrument): void {
    const key = getInstrumentIdentityKey(instrument);

    this.instruments.set(key, instrument);
  }

  getByIdentity(
    instrument: Instrument,
  ): Instrument | null {
    return (
      this.instruments.get(
        getInstrumentIdentityKey(instrument),
      ) ?? null
    );
  }

  get(
    countryCode: string,
    exchangeId: string,
    symbol: string,
  ): Instrument | null {
    const key = [
      countryCode.trim().toUpperCase(),
      exchangeId.trim().toLowerCase(),
      symbol.trim().toUpperCase(),
    ].join(":");

    return this.instruments.get(key) ?? null;
  }

  list(): Instrument[] {
    return [...this.instruments.values()];
  }

  size(): number {
    return this.instruments.size;
  }

  clear(): void {
    this.instruments.clear();
  }
}
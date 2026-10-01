import type { Instrument } from "@tickerapp/shared";

import { GLOBAL_INSTRUMENTS } from "./instrument-catalog";
import {
  getInstrumentIdentityKey,
  normalizeSymbol,
} from "./instrument-identity";

export class InstrumentRegistry {
  private readonly instruments =
    new Map<string, Instrument>();

  constructor(
    instruments: Instrument[] = GLOBAL_INSTRUMENTS,
  ) {
    for (const instrument of instruments) {
      this.upsert(instrument);
    }
  }

  register(
    instrument: Instrument,
  ): void {
    const key =
      getInstrumentIdentityKey(
        instrument,
      );

    if (this.instruments.has(key)) {
      throw new Error(
        `Instrument "${key}" is already registered.`,
      );
    }

    this.instruments.set(
      key,
      instrument,
    );
  }

  upsert(
    instrument: Instrument,
  ): void {
    const key =
      getInstrumentIdentityKey(
        instrument,
      );

    this.instruments.set(
      key,
      instrument,
    );
  }

  getByIdentity(
    instrument: Instrument,
  ): Instrument | null {
    return (
      this.instruments.get(
        getInstrumentIdentityKey(
          instrument,
        ),
      ) ?? null
    );
  }

  get(
    countryCode: string,
    exchangeId: string,
    symbol: string,
  ): Instrument | null {
    const key = [
      countryCode
        .trim()
        .toUpperCase(),
      exchangeId
        .trim()
        .toLowerCase(),
      normalizeSymbol(symbol),
    ].join(":");

    return (
      this.instruments.get(key) ??
      null
    );
  }

  findBySymbol(
    symbol: string,
  ): Instrument[] {
    const normalizedSymbol =
      normalizeSymbol(symbol);

    return this.list().filter(
      (instrument) =>
        normalizeSymbol(
          instrument.symbol,
        ) === normalizedSymbol,
    );
  }

  findByCountry(
    countryCode: string,
  ): Instrument[] {
    const normalizedCountryCode =
      countryCode
        .trim()
        .toUpperCase();

    return this.list().filter(
      (instrument) =>
        instrument.countryCode
          .trim()
          .toUpperCase() ===
        normalizedCountryCode,
    );
  }

  findByExchange(
    exchangeId: string,
  ): Instrument[] {
    const normalizedExchangeId =
      exchangeId
        .trim()
        .toLowerCase();

    return this.list().filter(
      (instrument) =>
        instrument.exchangeId
          .trim()
          .toLowerCase() ===
        normalizedExchangeId,
    );
  }

  findByCountryAndExchange(
    countryCode: string,
    exchangeId: string,
  ): Instrument[] {
    const normalizedCountryCode =
      countryCode
        .trim()
        .toUpperCase();

    const normalizedExchangeId =
      exchangeId
        .trim()
        .toLowerCase();

    return this.list().filter(
      (instrument) =>
        instrument.countryCode
          .trim()
          .toUpperCase() ===
          normalizedCountryCode &&
        instrument.exchangeId
          .trim()
          .toLowerCase() ===
          normalizedExchangeId,
    );
  }

  list(): Instrument[] {
    return [
      ...this.instruments.values(),
    ];
  }

  size(): number {
    return this.instruments.size;
  }

  clear(): void {
    this.instruments.clear();
  }
}
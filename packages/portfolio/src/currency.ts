export interface FxRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  asOf: string;
}

export interface FxRateProvider {
  getRate(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<FxRate>;
}

export function normalizeCurrency(
  currency: string,
): string {
  return currency.trim().toUpperCase();
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rate: number,
): number {
  if (!Number.isFinite(amount)) {
    throw new Error("Amount must be finite.");
  }

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("FX rate must be a positive finite number.");
  }

  const from = normalizeCurrency(fromCurrency);
  const to = normalizeCurrency(toCurrency);

  if (!from || !to) {
    throw new Error("Both currencies are required.");
  }

  if (from === to) {
    return amount;
  }

  return amount * rate;
}
export interface MarketDataApiError {
  error: string;
  code?: string;
  providerId?: string | null;
}

export interface MarketDataApiSuccess<T> {
  data: T;
}

export interface MarketDataApiList<T> {
  items: T[];
  count: number;
}
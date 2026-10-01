import type {
  Exchange,
  Instrument,
  OHLCVBar,
  Quote,
} from "@tickerapp/shared";

import type {
  HistoricalPriceRequest,
  InstrumentSearchResult,
  MarketDataProvider,
  MarketDataProviderHealth,
} from "../index";

import { MarketDataError } from "../errors";
import {
  normalizeProviderInstrument,
} from "../instrument-normalizer";

interface TwelveDataResponse {
  status?: string;
  message
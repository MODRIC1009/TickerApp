export type MarketRegion =
  | "north-america"
  | "europe"
  | "asia-pacific"
  | "latin-america"
  | "middle-east"
  | "africa";

export type AssetClass =
  | "equity"
  | "etf"
  | "adr"
  | "reit"
  | "fund";

export interface Exchange {
  id: string;
  name: string;
  countryCode: string;
  region: MarketRegion;
  currency: string;
  timezone: string;
  regularSession: {
    open: string;
    close: string;
  };
}

export interface Instrument {
  symbol: string;
  name: string;
  exchangeId: string;
  countryCode: string;
  currency: string;
  assetClass: AssetClass;
  identifiers?: {
    isin?: string;
    cusip?: string;
    sedol?: string;
    figi?: string;
  };
  metadata?: InstrumentMetadata;
}

export interface InstrumentClassification {
  sector?: string;
  industry?: string;
  countryOfDomicile?: string;
  countryOfListing?: string;
}

export interface InstrumentSource {
  providerId: string;
  providerSymbol: string;
  providerExchangeId?: string;
}

export interface InstrumentMetadata {
  classification?: InstrumentClassification;
  source?: InstrumentSource;
}

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  timestamp: string;
}

export interface OHLCVBar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ValuationMetrics {
  marketCap?: number;
  enterpriseValue?: number;

  priceToEarnings?: number;
  forwardPriceToEarnings?: number;
  pegRatio?: number;

  priceToBook?: number;
  priceToSales?: number;

  evToSales?: number;
  evToEbitda?: number;
  evToEbit?: number;
  evToFcf?: number;

  priceToFcf?: number;

  earningsYield?: number;
  fcfYield?: number;
  dividendYield?: number;
}

export interface ProfitabilityMetrics {
  grossMargin?: number;
  operatingMargin?: number;
  ebitMargin?: number;
  ebitdaMargin?: number;
  netMargin?: number;

  returnOnAssets?: number;
  returnOnEquity?: number;
  returnOnInvestedCapital?: number;
  returnOnCapitalEmployed?: number;

  assetTurnover?: number;
  roicSpread?: number;
}

export interface GrowthMetrics {
  revenueGrowth?: number;
  revenueCagr3Y?: number;
  revenueCagr5Y?: number;

  epsGrowth?: number;
  epsCagr3Y?: number;
  epsCagr5Y?: number;

  ebitdaGrowth?: number;
  ebitGrowth?: number;
  freeCashFlowGrowth?: number;

  bookValueGrowth?: number;
  dividendGrowth?: number;

  marginExpansion?: number;
}

export interface BalanceSheetMetrics {
  totalAssets?: number;
  totalLiabilities?: number;
  totalEquity?: number;

  cashAndEquivalents?: number;
  totalDebt?: number;
  netDebt?: number;

  debtToEquity?: number;
  debtToAssets?: number;
  netDebtToEbitda?: number;

  currentRatio?: number;
  quickRatio?: number;
  cashRatio?: number;

  interestCoverage?: number;
  debtServiceCoverage?: number;

  financialLeverage?: number;
}

export interface CashFlowMetrics {
  operatingCashFlow?: number;
  capitalExpenditure?: number;
  freeCashFlow?: number;

  operatingCashFlowMargin?: number;
  freeCashFlowMargin?: number;

  freeCashFlowConversion?: number;
  cashFlowToNetIncome?: number;

  capexToRevenue?: number;

  cashConversionCycle?: number;
  workingCapital?: number;
  workingCapitalTurnover?: number;
}

export interface TechnicalMetrics {
  sma20?: number;
  sma50?: number;
  sma100?: number;
  sma200?: number;

  ema20?: number;
  ema50?: number;
  ema200?: number;

  rsi14?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;

  bollingerUpper?: number;
  bollingerMiddle?: number;
  bollingerLower?: number;

  atr14?: number;
  adx14?: number;
  rateOfChange?: number;

  momentum1M?: number;
  momentum3M?: number;
  momentum6M?: number;
  momentum12M?: number;

  week52High?: number;
  week52Low?: number;

  distanceFrom52WeekHigh?: number;
  distanceFrom52WeekLow?: number;

  relativeStrength?: number;
  volumeTrend?: number;
  volumeAcceleration?: number;

  volatilityRegime?: "low" | "normal" | "high" | "extreme";
}

export interface RiskMetrics {
  beta?: number;
  alpha?: number;

  volatility30D?: number;
  volatility60D?: number;
  volatility90D?: number;
  volatility1Y?: number;

  downsideDeviation?: number;

  maxDrawdown?: number;

  valueAtRisk95?: number;
  valueAtRisk99?: number;

  conditionalVaR95?: number;
  conditionalVaR99?: number;

  sharpeRatio?: number;
  sortinoRatio?: number;
  calmarRatio?: number;

  trackingError?: number;

  marketCorrelation?: number;
  sectorCorrelation?: number;

  riskScore?: number;
}

export interface OwnershipMetrics {
  insiderOwnership?: number;
  institutionalOwnership?: number;

  insiderBuying?: number;
  insiderSelling?: number;

  sharesOutstanding?: number;
  sharesChangeYoY?: number;

  buybackYield?: number;
  dividendPayoutRatio?: number;
  dividendGrowth?: number;
}

export interface EarningsMetrics {
  eps?: number;
  forwardEps?: number;

  revenuePerShare?: number;

  epsSurprise?: number;
  revenueSurprise?: number;

  earningsGrowth?: number;
  earningsVolatility?: number;

  earningsRevision30D?: number;
  earningsRevision90D?: number;

  analystEstimateCount?: number;

  nextEarningsDate?: string;
  lastEarningsDate?: string;
}

export interface RelativeMetrics {
  sectorPercentile?: number;
  industryPercentile?: number;
  countryPercentile?: number;

  historicalValuationPercentile?: number;

  peerPe?: number;
  peerForwardPe?: number;
  peerPriceToBook?: number;
  peerEvToEbitda?: number;

  peerRevenueGrowth?: number;
  peerEpsGrowth?: number;

  peerRoe?: number;
  peerRoic?: number;

  peerNetMargin?: number;
  peerDebtToEquity?: number;

  peerMomentum?: number;
}

export interface FactorScores {
  value?: number;
  quality?: number;
  growth?: number;
  momentum?: number;

  size?: number;
  lowVolatility?: number;
  profitability?: number;
  investment?: number;
  dividend?: number;

  financialHealth?: number;
  risk?: number;

  compositeResearchScore?: number;
}

export interface FinancialMetrics {
  valuation: ValuationMetrics;
  profitability: ProfitabilityMetrics;
  growth: GrowthMetrics;
  balanceSheet: BalanceSheetMetrics;
  cashFlow: CashFlowMetrics;
  technical: TechnicalMetrics;
  risk: RiskMetrics;
  ownership: OwnershipMetrics;
  earnings: EarningsMetrics;
  relative: RelativeMetrics;
  factors: FactorScores;
}

export interface StockSnapshot {
  instrument: Instrument;
  quote: Quote;
  metrics: FinancialMetrics;
  updatedAt: string;
}
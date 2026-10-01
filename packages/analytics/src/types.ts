export interface PricePoint {
  timestamp: string;
  price: number;
}

export interface ReturnPoint {
  timestamp: string;
  value: number;
}

export interface DrawdownPoint {
  timestamp: string;
  equity: number;
  peak: number;
  drawdown: number;
  drawdownPercent: number;
}

export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  winRate: number;
  profitFactor: number;
  bestPeriod: number;
  worstPeriod: number;
  observationCount: number;
}

export interface BenchmarkMetrics {
  alpha: number;
  beta: number;
  correlation: number;
  trackingError: number;
  informationRatio: number;
}

export interface BacktestSummary {
  initialCapital: number;
  finalCapital: number;
  netProfit: number;
  totalReturn: number;
  annualizedReturn: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  winRate: number;
  profitFactor: number;
  tradeCount: number;
}

export interface EquityPoint {
  timestamp: string;
  equity: number;
  cash: number;
  positionValue: number;
  return: number;
  cumulativeReturn: number;
  drawdown: number;
  drawdownPercent: number;
}

export interface Trade {
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  fees: number;
  slippage: number;
  timestamp: string;
  realizedPnl?: number;
}

export interface BacktestResult {
  strategyId: string;
  symbol: string;
  startDate: string;
  endDate: string;
  summary: BacktestSummary;
  equityCurve: EquityPoint[];
  trades: Trade[];
}
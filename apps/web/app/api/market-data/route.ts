import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    service: "market-data",
    version: "1",
    endpoints: {
      providers: "/api/market-data/providers",
      status: "/api/market-data/status",
      search: "/api/market-data/search?q=AAPL",
      instrument: "/api/market-data/instrument?symbol=AAPL",
      instrumentIdentity:
        "/api/market-data/instrument/identity?country=US&exchange=nasdaq&symbol=AAPL",
      quote: "/api/market-data/quote?symbol=AAPL",
      history:
        "/api/market-data/history?symbol=AAPL&startDate=2026-01-01&endDate=2026-01-31&interval=1d",
      exchanges: "/api/market-data/exchanges",
      session:
        "/api/market-data/session?exchange=nasdaq",
    },
  });
}
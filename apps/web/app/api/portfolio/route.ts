import { NextResponse } from "next/server";

import {
  PortfolioError,
  type Portfolio,
} from "@tickerapp/portfolio";

import { getPortfolioService } from "@/lib/portfolio";

function getErrorStatus(error: unknown): number {
  if (!(error instanceof PortfolioError)) {
    return 500;
  }

  switch (error.code) {
    case "invalid_request":
    case "invalid_transaction":
      return 400;

    case "portfolio_not_found":
      return 404;

    case "position_not_found":
      return 404;

    case "insufficient_cash":
    case "insufficient_quantity":
      return 409;

    default:
      return 500;
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const portfolios = getPortfolioService().listPortfolios();

    return NextResponse.json({ portfolios });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch portfolios.",
      },
      { status: getErrorStatus(error) },
    );
  }
}

export async function POST(
  request: Request,
): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Portfolio;

    const portfolio = getPortfolioService().createPortfolio(body);

    return NextResponse.json(
      { portfolio },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create portfolio.",
      },
      { status: getErrorStatus(error) },
    );
  }
}
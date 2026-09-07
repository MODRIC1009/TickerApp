import { NextResponse } from "next/server";

import { PortfolioError } from "@tickerapp/portfolio";

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
    case "position_not_found":
      return 404;

    case "insufficient_cash":
    case "insufficient_quantity":
      return 409;

    default:
      return 500;
  }
}

interface RouteContext {
  params: Promise<{
    portfolioId: string;
  }>;
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { portfolioId } = await context.params;

    if (!portfolioId.trim()) {
      throw new PortfolioError(
        "invalid_request",
        "Portfolio id is required.",
      );
    }

    const positions =
      getPortfolioService().getPositions(portfolioId);

    return NextResponse.json({ positions });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch portfolio positions.",
      },
      { status: getErrorStatus(error) },
    );
  }
}
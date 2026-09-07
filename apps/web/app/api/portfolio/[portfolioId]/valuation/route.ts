import { NextResponse } from "next/server";

import { PortfolioError } from "@tickerapp/portfolio";

import { getPortfolioService } from "@/lib/portfolio";

interface RouteContext {
  params: Promise<{
    portfolioId: string;
  }>;
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { portfolioId } =
      await context.params;

    const service =
      getPortfolioService();

    const valuation =
      await service.getValuation(
        portfolioId,
        new Date().toISOString(),
      );

    return NextResponse.json({
      valuation,
    });
  } catch (error) {
    if (
      error instanceof PortfolioError &&
      error.code === "portfolio_not_found"
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 404,
        },
      );
    }

    console.error(
      "Portfolio valuation failed.",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to calculate portfolio valuation.",
      },
      {
        status: 500,
      },
    );
  }
}
import { NextResponse } from "next/server";

import { PortfolioError } from "@tickerapp/portfolio";

import { getPortfolioService } from "@/lib/portfolio";
import { getPortfolioRiskAnalysis } from "@/lib/portfolio-risk-service";

interface RouteContext {
  params: Promise<{
    portfolioId: string;
  }>;
}

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

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { portfolioId } =
      await context.params;

    if (!portfolioId.trim()) {
      throw new PortfolioError(
        "invalid_request",
        "Portfolio id is required.",
      );
    }

    const portfolioService =
      getPortfolioService();

    const portfolio =
      portfolioService.getPortfolio(
        portfolioId,
      );

    const positions =
      portfolioService.getPositions(
        portfolioId,
      );

    const analysis =
      await getPortfolioRiskAnalysis(
        portfolio.id,
        positions,
      );

    return NextResponse.json(
      {
        success: true,
        result: analysis,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "private, no-store",
        },
      },
    );
  } catch (error) {
    const status =
      getErrorStatus(error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code:
            error instanceof PortfolioError
              ? error.code
              : "portfolio_risk_error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to calculate portfolio risk.",
        },
      },
      {
        status,
        headers: {
          "Cache-Control":
            "private, no-store",
        },
      },
    );
  }
}
import { NextResponse } from "next/server";

import {
  PortfolioError,
  type Transaction,
} from "@tickerapp/portfolio";

import { getPortfolioService } from "@/lib/portfolio";

export async function GET(
  request: Request,
) {
  const { searchParams } =
    new URL(request.url);

  const portfolioId =
    searchParams.get("portfolioId");

  if (!portfolioId) {
    return NextResponse.json(
      {
        error: "portfolioId is required.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const service =
      getPortfolioService();

    const transactions =
      service.getTransactions(
        portfolioId,
      );

    return NextResponse.json({
      transactions,
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
      "Portfolio transactions fetch failed.",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch portfolio transactions.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: Request,
) {
  try {
    const body =
      (await request.json()) as Transaction;

    const service =
      getPortfolioService();

    const transaction =
      await service.recordTransaction(
        body,
      );

    return NextResponse.json(
      {
        transaction,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    if (
      error instanceof PortfolioError
    ) {
      const status =
        error.code ===
        "portfolio_not_found"
          ? 404
          : error.code ===
              "insufficient_cash" ||
            error.code ===
              "insufficient_quantity"
            ? 409
            : 400;

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status,
        },
      );
    }

    console.error(
      "Portfolio transaction creation failed.",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to create portfolio transaction.",
      },
      {
        status: 500,
      },
    );
  }
}
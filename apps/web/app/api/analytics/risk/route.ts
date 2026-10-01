import { NextResponse } from "next/server";

import { getRiskAnalysis } from "@/lib/risk-service";

type RiskRequestBody = {
  symbol: string;
};

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parseSymbol(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.trim().length > 32
  ) {
    throw new Error("A valid symbol is required.");
  }

  return value.trim().toUpperCase();
}

function errorResponse(
  status: number,
  code: string,
  message: string,
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

function getErrorDetails(error: unknown): {
  status: number;
  code: string;
  message: string;
} {
  if (!(error instanceof Error)) {
    return {
      status: 500,
      code: "risk_engine_error",
      message:
        "Unable to calculate quantitative risk.",
    };
  }

  const message = error.message;

  if (
    message.includes(
      "No market quote is available",
    )
  ) {
    return {
      status: 404,
      code: "quote_unavailable",
      message,
    };
  }

  if (
    message.includes(
      "Insufficient historical data",
    )
  ) {
    return {
      status: 422,
      code: "insufficient_history",
      message,
    };
  }

  if (
    message.includes(
      "Insufficient valid price history",
    )
  ) {
    return {
      status: 422,
      code: "insufficient_returns",
      message,
    };
  }

  if (
    message === "A valid symbol is required."
  ) {
    return {
      status: 400,
      code: "invalid_request",
      message,
    };
  }

  return {
    status: 500,
    code: "risk_engine_error",
    message:
      "Unable to calculate quantitative risk.",
  };
}

export async function POST(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown =
      await request.json();

    if (!isRecord(body)) {
      return errorResponse(
        400,
        "invalid_request",
        "Request body must be an object.",
      );
    }

    const requestBody =
      body as Partial<RiskRequestBody>;

    const symbol =
      parseSymbol(requestBody.symbol);

    const analysis =
      await getRiskAnalysis(symbol);

    return NextResponse.json(
      {
        success: true,
        result: analysis.result,
        provenance: analysis.provenance,
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
    const details =
      getErrorDetails(error);

    return errorResponse(
      details.status,
      details.code,
      details.message,
    );
  }
}
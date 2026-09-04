"""Portfolio-level analytics for Ticker Metrics Terminal.

The functions in this module are intentionally deterministic and data-only.
They describe the supplied holdings; they do not make investment recommendations
or calculate leverage.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any


class PortfolioValidationError(ValueError):
    """Raised when a portfolio cannot be evaluated safely."""


def normalise_weights(weights: Sequence[float]) -> list[float]:
    """Convert positive holding weights into portfolio weights that sum to 1."""
    if not weights:
        raise PortfolioValidationError("Add at least one holding to a portfolio.")

    cleaned = [float(weight) for weight in weights]
    if any(weight <= 0 for weight in cleaned):
        raise PortfolioValidationError("Each holding weight must be greater than zero.")

    total = sum(cleaned)
    return [weight / total for weight in cleaned]


def _weighted_average(values: Sequence[float], weights: Sequence[float]) -> float:
    return sum(value * weight for value, weight in zip(values, weights, strict=True))


def _risk_label(score: float) -> str:
    if score <= 0.20:
        return "Very Stable"
    if score <= 0.40:
        return "Stable"
    if score <= 0.60:
        return "Moderate"
    if score <= 0.80:
        return "Risky"
    return "Very Risky"


def build_portfolio_summary(
    holdings: Sequence[dict[str, Any]], weights: Sequence[float]
) -> dict[str, Any]:
    """Return transparent weighted portfolio metrics for the selected holdings.

    Each holding must include Ticker, Risk Score, Beta, Historical Volatility
    30D, Historical Volatility 60D, and Historical Volatility 90D.
    """
    if len(holdings) != len(weights):
        raise PortfolioValidationError("Each holding needs one corresponding weight.")
    if len(holdings) < 2:
        raise PortfolioValidationError("Add at least two holdings to compare a portfolio.")

    normalised = normalise_weights(weights)
    required = (
        "Ticker",
        "Risk Score",
        "Beta",
        "Historical Volatility 30D",
        "Historical Volatility 60D",
        "Historical Volatility 90D",
    )
    for holding in holdings:
        missing = [field for field in required if holding.get(field) is None]
        if missing:
            label = holding.get("Ticker", "Unknown holding")
            raise PortfolioValidationError(f"{label} is missing: {', '.join(missing)}.")

    risk_score = _weighted_average([float(item["Risk Score"]) for item in holdings], normalised)
    concentration = sum(weight**2 for weight in normalised)
    effective_holdings = 1 / concentration

    return {
        "holdings": [
            {"ticker": item["Ticker"], "weight": round(weight * 100, 2)}
            for item, weight in zip(holdings, normalised, strict=True)
        ],
        "holding_count": len(holdings),
        "effective_holdings": round(effective_holdings, 2),
        "concentration_index": round(concentration, 4),
        "risk_score": round(risk_score, 4),
        "risk_group": _risk_label(risk_score),
        "beta": round(_weighted_average([float(item["Beta"]) for item in holdings], normalised), 4),
        "volatility_30d": round(_weighted_average([float(item["Historical Volatility 30D"]) for item in holdings], normalised), 4),
        "volatility_60d": round(_weighted_average([float(item["Historical Volatility 60D"]) for item in holdings], normalised), 4),
        "volatility_90d": round(_weighted_average([float(item["Historical Volatility 90D"]) for item in holdings], normalised), 4),
    }

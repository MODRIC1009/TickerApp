"""
risk_classifier.py
----------------
Scores every ticker 0 (safest) to 1 (riskiest) using weighted percentile
ranks of Market Cap (40%), Volume in USD (30%), Beta (20%), and 60D
Volatility (10%) - matching your stated priority order. Groups tickers
into 5 tiers using FIXED risk-score thresholds (not equal-sized buckets),
so the group sizes reflect how the actual data is distributed - e.g. if
most stocks genuinely cluster in "Moderate", that tier will be the
largest, rather than forcing an artificial 20% into every tier.
"""

import pandas as pd

WEIGHT_MARKET_CAP = 0.40
WEIGHT_VOLUME_USD = 0.30
WEIGHT_BETA = 0.20
WEIGHT_VOLATILITY_60D = 0.10

MAX_LEVERAGE_SAFEST = 10.0
MIN_LEVERAGE_RISKIEST = 1.0

RISK_GROUPS = ["Very Stable", "Stable", "Moderate", "Risky", "Very Risky"]

# Fixed cut points on the 0.0-1.0 Risk Score scale. A ticker's actual
# score decides its group - group sizes are whatever the real data gives.
# Change these numbers to shift where each tier's boundary sits.
RISK_SCORE_BINS = [0.0, 0.20, 0.40, 0.60, 0.80, 1.0]


def classify_all_tickers(df: pd.DataFrame) -> pd.DataFrame:
    result = df.copy()

    pct_market_cap = result["Market Cap"].rank(pct=True)
    pct_volume_usd = result["Volume in USD"].rank(pct=True)
    pct_beta = result["Beta"].rank(pct=True)
    pct_vol_60d = result["Historical Volatility 60D"].rank(pct=True)

    risk_score = (
        WEIGHT_MARKET_CAP * (1 - pct_market_cap)
        + WEIGHT_VOLUME_USD * (1 - pct_volume_usd)
        + WEIGHT_BETA * pct_beta
        + WEIGHT_VOLATILITY_60D * pct_vol_60d
    )
    result["Risk Score"] = risk_score.round(4)

    # Fixed thresholds, NOT equal-sized buckets - group sizes now reflect
    # how tickers actually distribute across the risk spectrum.
    result["Risk Group"] = pd.cut(
        result["Risk Score"], bins=RISK_SCORE_BINS, labels=RISK_GROUPS,
        include_lowest=True,
    )

    leverage_range = MAX_LEVERAGE_SAFEST - MIN_LEVERAGE_RISKIEST
    result["Suggested Leverage"] = (
        MAX_LEVERAGE_SAFEST - (result["Risk Score"] * leverage_range)
    ).round(2)

    return result


def get_group_summary(classified_df: pd.DataFrame) -> pd.DataFrame:
    summary = (
        classified_df.groupby("Risk Group", observed=True)
        .agg(
            Ticker_Count=("Ticker", "count"),
            Avg_Leverage=("Suggested Leverage", "mean"),
            Avg_Market_Cap=("Market Cap", "mean"),
            Avg_Beta=("Beta", "mean"),
        )
        .reindex(RISK_GROUPS)
        .round(2)
    )
    return summary
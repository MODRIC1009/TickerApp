"""
charts_plotly.py
----------------
Builds every chart used in the Streamlit app with Plotly, so each one is
interactive (hover tooltips, zoom, pan) instead of a static image. All
charts share a dark theme matching app.py's color scheme.
"""

import plotly.graph_objects as go
import numpy as np

COLOR_BG = "#000000"
COLOR_PANEL = "#0a0a0a"
COLOR_ACCENT = "#00f7ff"
COLOR_ACCENT2 = "#f5ff00"
COLOR_ACCENT3 = "#39ff14"
COLOR_ACCENT4 = "#ff00e6"
COLOR_ACCENT5 = "#ff5f5f"
COLOR_TEXT = "#f1f5f9"
COLOR_GRID = "#2a2a2a"

PALETTE = [COLOR_ACCENT, COLOR_ACCENT2, COLOR_ACCENT3, COLOR_ACCENT4, COLOR_ACCENT5, "#fb923c", "#22d3ee"]

RISK_GROUP_COLORS = {
    "Very Stable": "#4ade80", "Stable": "#a3e635", "Moderate": "#fbbf24",
    "Risky": "#fb923c", "Very Risky": "#f87171",
}


def _base_layout(title, height=340):
    return dict(
        title=dict(text=title, font=dict(color=COLOR_TEXT, size=15)),
        plot_bgcolor=COLOR_PANEL, paper_bgcolor=COLOR_PANEL,
        font=dict(color=COLOR_TEXT, size=12),
        margin=dict(l=40, r=20, t=50, b=40),
        height=height,
        xaxis=dict(gridcolor=COLOR_GRID, zeroline=False),
        yaxis=dict(gridcolor=COLOR_GRID, zeroline=False),
    )


def volatility_chart(data: dict):
    labels = ["30D", "60D", "90D"]
    values = [data["Historical Volatility 30D"], data["Historical Volatility 60D"], data["Historical Volatility 90D"]]
    fig = go.Figure(go.Bar(
        x=labels, y=values, marker_color=[COLOR_ACCENT, COLOR_ACCENT2, COLOR_ACCENT3],
        text=[f"{v:.1f}%" for v in values], textposition="outside",
        hovertemplate="Volatility %{x}: %{y:.2f}%<extra></extra>",
    ))
    fig.update_layout(**_base_layout("Historical Volatility"))
    fig.update_yaxes(title="Volatility (%)")
    return fig


def vs_market_chart(data: dict, market_avg: dict):
    metrics = ["Beta", "Volatility 30D"]
    ticker_vals = [data["Beta"], data["Historical Volatility 30D"]]
    market_vals = [market_avg["Beta"], market_avg["Historical Volatility 30D"]]

    fig = go.Figure()
    fig.add_trace(go.Bar(y=metrics, x=ticker_vals, name=data["Ticker"], orientation="h",
                          marker_color=COLOR_ACCENT, hovertemplate="%{y}: %{x:.2f}<extra></extra>"))
    fig.add_trace(go.Bar(y=metrics, x=market_vals, name="Market Avg", orientation="h",
                          marker_color=COLOR_GRID, hovertemplate="%{y}: %{x:.2f}<extra></extra>"))
    fig.update_layout(**_base_layout("This Ticker vs. Market Average"))
    fig.update_layout(barmode="group", legend=dict(bgcolor=COLOR_PANEL, font=dict(color=COLOR_TEXT)))
    return fig


def market_cap_gauge(data: dict, all_market_caps: list):
    caps = np.array([c for c in all_market_caps if c and c > 0])
    this_cap = data["Market Cap"] or 0
    percentile = (caps < this_cap).sum() / len(caps) * 100 if len(caps) else 0

    fig = go.Figure(go.Indicator(
        mode="gauge+number", value=percentile,
        number={"suffix": "th percentile", "font": {"color": COLOR_TEXT, "size": 26}},
        gauge={
            "axis": {"range": [0, 100], "tickcolor": COLOR_TEXT},
            "bar": {"color": COLOR_ACCENT},
            "bgcolor": COLOR_PANEL,
            "bordercolor": COLOR_GRID,
        },
    ))
    fig.update_layout(paper_bgcolor=COLOR_PANEL, font=dict(color=COLOR_TEXT),
                       height=220, margin=dict(l=30, r=30, t=30, b=10),
                       title=dict(text="Market Cap Percentile Rank", font=dict(color=COLOR_TEXT, size=14)))
    return fig


def comparison_chart(tickers_data: list, metric: str):
    names = [d["Ticker"] for d in tickers_data]
    values = [d[metric] for d in tickers_data]
    colors = [PALETTE[i % len(PALETTE)] for i in range(len(names))]

    if "Volatility" in metric:
        text = [f"{v:.1f}%" for v in values]
    elif metric in ("Beta", "Risk Score"):
        text = [f"{v:.2f}" for v in values]
    elif metric in ("Market Cap", "Volume in USD"):
        text = [_short_number(v) for v in values]
    else:
        text = [f"{v:,.0f}" for v in values]

    fig = go.Figure(go.Bar(
        x=names, y=values, marker_color=colors, text=text, textposition="outside",
        hovertemplate="%{x}<br>" + metric + ": %{text}<extra></extra>",
    ))
    fig.update_layout(**_base_layout(f"Comparison: {metric}", height=420))
    return fig


def radar_chart(tickers_data: list):
    categories = ["Beta", "Risk Score", "Vol 30D", "Vol 60D", "Vol 90D"]
    keys = ["Beta", "Risk Score", "Historical Volatility 30D",
            "Historical Volatility 60D", "Historical Volatility 90D"]

    raw = np.array([[d[k] or 0 for k in keys] for d in tickers_data])
    maxes = raw.max(axis=0)
    maxes[maxes == 0] = 1
    norm = raw / maxes

    fig = go.Figure()
    for i, d in enumerate(tickers_data):
        vals = norm[i].tolist()
        vals += vals[:1]
        cats = categories + [categories[0]]
        fig.add_trace(go.Scatterpolar(
            r=vals, theta=cats, fill="toself", name=d["Ticker"],
            line=dict(color=PALETTE[i % len(PALETTE)]),
            hovertemplate="%{theta}: %{r:.2f}<extra>" + d["Ticker"] + "</extra>",
        ))

    fig.update_layout(
        polar=dict(bgcolor=COLOR_PANEL, radialaxis=dict(visible=True, showticklabels=False, gridcolor=COLOR_GRID),
                    angularaxis=dict(gridcolor=COLOR_GRID, color=COLOR_TEXT)),
        paper_bgcolor=COLOR_PANEL, font=dict(color=COLOR_TEXT),
        title=dict(text="Risk Profile Shape (normalized)", font=dict(color=COLOR_TEXT, size=15)),
        legend=dict(bgcolor=COLOR_PANEL, font=dict(color=COLOR_TEXT)),
        height=440, margin=dict(l=40, r=40, t=60, b=40),
    )
    return fig


def risk_group_bar_chart(summary_df):
    groups = summary_df.index.tolist()
    counts = summary_df["Ticker_Count"].tolist()
    colors = [RISK_GROUP_COLORS.get(g, COLOR_ACCENT) for g in groups]
    fig = go.Figure(go.Bar(
        x=groups, y=counts, marker_color=colors, text=counts, textposition="outside",
        hovertemplate="%{x}: %{y} tickers<extra></extra>",
    ))
    fig.update_layout(**_base_layout("Tickers per Risk Group"))
    fig.update_yaxes(title="Number of Tickers")
    return fig


def leverage_by_group_chart(summary_df):
    groups = summary_df.index.tolist()
    leverage = summary_df["Avg_Leverage"].tolist()
    colors = [RISK_GROUP_COLORS.get(g, COLOR_ACCENT) for g in groups]
    fig = go.Figure(go.Bar(
        x=groups, y=leverage, marker_color=colors,
        text=[f"{v:.1f}x" for v in leverage], textposition="outside",
        hovertemplate="%{x}: %{y:.2f}x<extra></extra>",
    ))
    fig.update_layout(**_base_layout("Average Suggested Leverage per Group"))
    fig.update_yaxes(title="Suggested Leverage")
    return fig


def risk_score_histogram(all_risk_scores):
    fig = go.Figure(go.Histogram(
        x=all_risk_scores, nbinsx=30, marker_color=COLOR_ACCENT,
        hovertemplate="Risk Score: %{x}<br>Count: %{y}<extra></extra>",
    ))
    fig.update_layout(**_base_layout("Risk Score Distribution (All Tickers)"))
    fig.update_xaxes(title="Risk Score (0 = Safest, 1 = Riskiest)")
    fig.update_yaxes(title="Number of Tickers")
    return fig


def _short_number(value):
    value = float(value)
    abs_v = abs(value)
    if abs_v >= 1_000_000_000_000:
        return f"{value/1_000_000_000_000:.2f}T"
    if abs_v >= 1_000_000_000:
        return f"{value/1_000_000_000:.2f}B"
    if abs_v >= 1_000_000:
        return f"{value/1_000_000:.2f}M"
    return f"{value:,.0f}"
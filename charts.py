"""
charts.py
----------------
Builds all matplotlib charts used in the app, pre-styled to match
the dark theme in ui.py. Keeping chart-building code separate means
ui.py only has to ask for a chart and place it on screen -- it
doesn't need to know how the chart is drawn.

Every function returns a matplotlib Figure object, which ui.py then
embeds into the Tkinter window using FigureCanvasTkAgg.
"""

import matplotlib
matplotlib.use("Agg")  # safe default backend; ui.py swaps in TkAgg canvas
import matplotlib.pyplot as plt
import numpy as np

# Must match the palette in ui.py
COLOR_BG = "#1e293b"
COLOR_ACCENT = "#38bdf8"
COLOR_ACCENT2 = "#a78bfa"
COLOR_ACCENT3 = "#4ade80"
COLOR_ACCENT4 = "#fbbf24"
COLOR_ACCENT5 = "#f87171"
COLOR_TEXT = "#f1f5f9"
COLOR_GRID = "#334155"

PALETTE = [COLOR_ACCENT, COLOR_ACCENT2, COLOR_ACCENT3, COLOR_ACCENT4, COLOR_ACCENT5, "#fb923c", "#22d3ee"]


def _style_axes(ax, title=""):
    """Applies consistent dark-theme styling to any chart axis."""
    ax.set_facecolor(COLOR_BG)
    ax.figure.set_facecolor(COLOR_BG)
    ax.tick_params(colors=COLOR_TEXT, labelsize=8)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(COLOR_GRID)
    ax.spines["bottom"].set_color(COLOR_GRID)
    ax.grid(axis="y", color=COLOR_GRID, linewidth=0.6, alpha=0.6)
    ax.set_axisbelow(True)
    if title:
        ax.set_title(title, color=COLOR_TEXT, fontsize=10, fontweight="bold", pad=10)


def build_volatility_chart(ticker_data: dict):
    """Bar chart of 30/60/90-day historical volatility for one ticker."""
    fig, ax = plt.subplots(figsize=(4.6, 3.0), dpi=100)
    labels = ["30D", "60D", "90D"]
    values = [
        ticker_data["Historical Volatility 30D"],
        ticker_data["Historical Volatility 60D"],
        ticker_data["Historical Volatility 90D"],
    ]
    bars = ax.bar(labels, values, color=[COLOR_ACCENT, COLOR_ACCENT2, COLOR_ACCENT3], width=0.55)
    for b, v in zip(bars, values):
        ax.text(b.get_x() + b.get_width() / 2, v, f"{v:.1f}%", ha="center",
                 va="bottom", color=COLOR_TEXT, fontsize=8, fontweight="bold")
    ax.set_ylabel("Volatility (%)", color=COLOR_TEXT, fontsize=8)
    _style_axes(ax, "Historical Volatility")
    fig.tight_layout()
    return fig


def build_vs_market_chart(ticker_data: dict, market_avg: dict):
    """Horizontal bar chart comparing this ticker's Beta and Volatility 30D vs market average."""
    fig, ax = plt.subplots(figsize=(4.6, 3.0), dpi=100)

    metrics = ["Beta", "Volatility 30D"]
    ticker_vals = [ticker_data["Beta"], ticker_data["Historical Volatility 30D"]]
    market_vals = [market_avg["Beta"], market_avg["Historical Volatility 30D"]]

    y = np.arange(len(metrics))
    height = 0.32

    ax.barh(y + height / 2, ticker_vals, height=height, color=COLOR_ACCENT, label=ticker_data["Ticker"])
    ax.barh(y - height / 2, market_vals, height=height, color=COLOR_GRID, label="Market Avg")

    ax.set_yticks(y)
    ax.set_yticklabels(metrics, color=COLOR_TEXT, fontsize=9)
    _style_axes(ax, "This Ticker vs. Market Average")
    ax.legend(facecolor=COLOR_BG, edgecolor=COLOR_GRID, labelcolor=COLOR_TEXT, fontsize=7, loc="lower right")
    fig.tight_layout()
    return fig


def build_market_cap_gauge(ticker_data: dict, all_market_caps):
    """
    A simple horizontal 'position' bar showing where this ticker's
    market cap ranks (as a percentile) among all tickers.
    """
    fig, ax = plt.subplots(figsize=(4.6, 1.6), dpi=100)

    caps = np.array([c for c in all_market_caps if c and c > 0])
    this_cap = ticker_data["Market Cap"] or 0
    percentile = (caps < this_cap).sum() / len(caps) * 100 if len(caps) else 0

    ax.barh([0], [100], color=COLOR_GRID, height=0.5)
    ax.barh([0], [percentile], color=COLOR_ACCENT, height=0.5)
    ax.set_xlim(0, 100)
    ax.set_yticks([])
    ax.set_xlabel("Market Cap Percentile Rank", color=COLOR_TEXT, fontsize=8)
    ax.text(percentile, 0, f" {percentile:.0f}th percentile", va="center",
             color=COLOR_TEXT, fontsize=9, fontweight="bold")

    _style_axes(ax)
    ax.spines["left"].set_visible(False)
    fig.tight_layout()
    return fig


def build_comparison_chart(tickers_data: list, metric: str):
    """
    Grouped bar chart comparing a chosen metric across multiple tickers.
    tickers_data: list of dicts (each from data_loader.get_metrics)
    metric: the dict key to compare, e.g. 'Market Cap'
    """
    fig, ax = plt.subplots(figsize=(7.4, 4.0), dpi=100)

    names = [d["Ticker"] for d in tickers_data]
    values = [d[metric] for d in tickers_data]
    colors = [PALETTE[i % len(PALETTE)] for i in range(len(names))]

    bars = ax.bar(names, values, color=colors, width=0.55)

    # Smart label formatting depending on metric scale
    for b, v in zip(bars, values):
        if v is None:
            continue
        if "Volatility" in metric:
            label = f"{v:.1f}%"
        elif metric in ("Market Cap", "Volume in USD"):
            label = _short_number(v)
        elif metric in ("Beta", "Risk Score"):
            label = f"{v:.2f}"
        else:
            label = f"{v:,.0f}"
        ax.text(b.get_x() + b.get_width() / 2, v, label, ha="center", va="bottom",
                 color=COLOR_TEXT, fontsize=8, fontweight="bold")

    ax.set_ylabel(metric, color=COLOR_TEXT, fontsize=9)
    _style_axes(ax, f"Comparison: {metric}")
    plt.setp(ax.get_xticklabels(), rotation=20, ha="right", fontsize=8)
    fig.tight_layout()
    return fig


def build_radar_chart(tickers_data: list):
    """
    Radar (spider) chart comparing tickers across 5 normalized metrics:
    Beta, Risk Score, Volatility 30D/60D/90D. Great for a quick 'shape'
    comparison, including the overall composite risk assessment.
    """
    categories = ["Beta", "Risk Score", "Vol 30D", "Vol 60D", "Vol 90D"]
    keys = ["Beta", "Risk Score", "Historical Volatility 30D",
            "Historical Volatility 60D", "Historical Volatility 90D"]
    n = len(categories)

    angles = np.linspace(0, 2 * np.pi, n, endpoint=False).tolist()
    angles += angles[:1]

    fig = plt.figure(figsize=(5.6, 5.4), dpi=100)
    ax = fig.add_subplot(111, polar=True)
    fig.patch.set_facecolor(COLOR_BG)
    ax.set_facecolor(COLOR_BG)

    ax.set_theta_offset(np.pi / 2)
    ax.set_theta_direction(-1)

    raw = np.array([[d[k] or 0 for k in keys] for d in tickers_data])
    maxes = raw.max(axis=0)
    maxes[maxes == 0] = 1
    norm = raw / maxes

    for i, d in enumerate(tickers_data):
        vals = norm[i].tolist()
        vals += vals[:1]
        color = PALETTE[i % len(PALETTE)]
        ax.plot(angles, vals, color=color, linewidth=2, label=d["Ticker"])
        ax.fill(angles, vals, color=color, alpha=0.12)

    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(categories, color=COLOR_TEXT, fontsize=9)
    ax.tick_params(axis="x", pad=14)
    ax.set_yticklabels([])
    ax.spines["polar"].set_color(COLOR_GRID)
    ax.grid(color=COLOR_GRID, alpha=0.6)
    ax.set_title("Risk Profile Shape (normalized)", color=COLOR_TEXT, fontsize=10,
                 fontweight="bold", pad=28)
    ax.legend(loc="upper right", bbox_to_anchor=(1.42, 1.15), facecolor=COLOR_BG,
              edgecolor=COLOR_GRID, labelcolor=COLOR_TEXT, fontsize=8)
    fig.subplots_adjust(top=0.82, bottom=0.08)
    return fig


def _short_number(value):
    """Local helper to shorten large numbers for chart data labels."""
    value = float(value)
    abs_v = abs(value)
    if abs_v >= 1_000_000_000_000:
        return f"{value/1_000_000_000_000:.1f}T"
    if abs_v >= 1_000_000_000:
        return f"{value/1_000_000_000:.1f}B"
    if abs_v >= 1_000_000:
        return f"{value/1_000_000:.1f}M"
    return f"{value:,.0f}"

RISK_GROUP_COLORS = {
    "Very Stable": "#4ade80", "Stable": "#a3e635", "Moderate": "#fbbf24",
    "Risky": "#fb923c", "Very Risky": "#f87171",
}


def build_risk_group_bar_chart(summary_df):
    fig, ax = plt.subplots(figsize=(6.4, 3.6), dpi=100)
    groups = summary_df.index.tolist()
    counts = summary_df["Ticker_Count"].tolist()
    colors = [RISK_GROUP_COLORS.get(g, COLOR_ACCENT) for g in groups]
    bars = ax.bar(groups, counts, color=colors, width=0.6)
    for b, v in zip(bars, counts):
        ax.text(b.get_x() + b.get_width()/2, v, f"{int(v)}", ha="center",
                 va="bottom", color=COLOR_TEXT, fontsize=9, fontweight="bold")
    ax.set_ylabel("Number of Tickers", color=COLOR_TEXT, fontsize=9)
    _style_axes(ax, "Tickers per Risk Group")
    plt.setp(ax.get_xticklabels(), rotation=15, ha="right", fontsize=8)
    fig.tight_layout()
    return fig


def build_leverage_by_group_chart(summary_df):
    fig, ax = plt.subplots(figsize=(6.4, 3.6), dpi=100)
    groups = summary_df.index.tolist()
    leverage = summary_df["Avg_Leverage"].tolist()
    colors = [RISK_GROUP_COLORS.get(g, COLOR_ACCENT) for g in groups]
    bars = ax.bar(groups, leverage, color=colors, width=0.6)
    for b, v in zip(bars, leverage):
        ax.text(b.get_x() + b.get_width()/2, v, f"{v:.1f}x", ha="center",
                 va="bottom", color=COLOR_TEXT, fontsize=9, fontweight="bold")
    ax.set_ylabel("Suggested Leverage", color=COLOR_TEXT, fontsize=9)
    _style_axes(ax, "Average Suggested Leverage per Group")
    plt.setp(ax.get_xticklabels(), rotation=15, ha="right", fontsize=8)
    fig.tight_layout()
    return fig


def build_risk_score_histogram(all_risk_scores):
    fig, ax = plt.subplots(figsize=(6.4, 3.2), dpi=100)
    ax.hist(all_risk_scores, bins=30, color=COLOR_ACCENT, edgecolor=COLOR_BG)
    ax.set_xlabel("Risk Score (0 = Safest, 1 = Riskiest)", color=COLOR_TEXT, fontsize=8)
    ax.set_ylabel("Number of Tickers", color=COLOR_TEXT, fontsize=8)
    _style_axes(ax, "Risk Score Distribution (All Tickers)")
    fig.tight_layout()
    return fig
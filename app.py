"""
app.py
----------------
The Streamlit web app. Run it with:

    streamlit run app.py

Three sections (as tabs):
  1. Ticker Lookup    - search by symbol or company name, see metrics + charts
  2. Compare Tickers   - pick 2-10 tickers, compare on any metric + radar chart
  3. Risk Groups        - every ticker auto-scored and grouped into 5 tiers,
                           with the full group browsable in a scrolling table
                           (Streamlit dataframes scroll natively - no extra
                           code needed for that).
"""

import streamlit as st
from data_loader import TickerDataStore
from formatters import format_currency, format_number, format_percent, format_beta
import charts_plotly as charts
from risk_classifier import RISK_GROUPS

MAX_COMPARE_TICKERS = 10

st.set_page_config(page_title="Ticker Metrics Terminal", page_icon="📊", layout="wide")

# ---------------------------------------------------------------------------
# THEME - black background w/ radial gradient + grid, neon accents, glass cards
# ---------------------------------------------------------------------------
st.markdown("""
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
    html, body, [class*="css"] { font-family: 'Rajdhani', sans-serif; }

    .stApp {
        background-color: #000000;
        background-image:
            radial-gradient(circle at 50% 15%, #1a0033 0%, #000000 60%),
            repeating-linear-gradient(0deg, rgba(0,247,255,0.035) 0px, rgba(0,247,255,0.035) 1px, transparent 1px, transparent 42px),
            repeating-linear-gradient(90deg, rgba(0,247,255,0.035) 0px, rgba(0,247,255,0.035) 1px, transparent 1px, transparent 42px);
        background-attachment: fixed;
    }
    section[data-testid="stSidebar"] { background-color: rgba(10, 10, 10, 0.85); }

    /* Custom scrollbar */
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-track { background: #000000; }
    ::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #00f7ff, #ff00e6);
        border-radius: 10px;
    }
    ::-webkit-scrollbar-thumb:hover { background: #f5ff00; }

    /* Main title - highlighter yellow, Orbitron, animated glow */
    h1 {
        font-family: 'Orbitron', sans-serif !important;
        font-weight: 800 !important;
        letter-spacing: 1px;
        color: #f5ff00 !important;
        animation: titleGlow 3.5s ease-in-out infinite;
    }
    @keyframes titleGlow {
        0%, 100% { text-shadow: 0 0 10px rgba(245, 255, 0, 0.45), 0 0 22px rgba(245, 255, 0, 0.15); }
        50% { text-shadow: 0 0 16px rgba(245, 255, 0, 0.7), 0 0 34px rgba(245, 255, 0, 0.3); }
    }

    /* Section headers - neon cyan, Orbitron */
    h2, h3 {
        font-family: 'Orbitron', sans-serif !important;
        font-weight: 600 !important;
        letter-spacing: 0.5px;
        color: #00f7ff !important;
        text-shadow: 0 0 6px rgba(0, 247, 255, 0.35);
    }

    /* Caption under the title - neon green, uppercase, tracked out */
    [data-testid="stCaptionContainer"], .stCaption {
        color: #39ff14 !important;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        font-size: 0.78rem !important;
        font-weight: 600;
    }

    /* Bold inline markdown labels (POPULAR TICKERS, etc.) */
    .stMarkdown strong {
        color: #ff00e6;
        letter-spacing: 1.5px;
        font-size: 0.82rem;
    }

    /* Tabs - glowing animated underline on active tab */
    .stTabs [data-baseweb="tab-list"] { gap: 6px; border-bottom: 1px solid rgba(0,247,255,0.15); }
    .stTabs [data-baseweb="tab"] {
        font-family: 'Orbitron', sans-serif;
        font-weight: 600;
        font-size: 0.85rem;
        color: #4d5568;
        padding: 10px 4px;
        transition: color 0.2s ease;
    }
    .stTabs [data-baseweb="tab"]:hover { color: #00f7ff; }
    .stTabs [aria-selected="true"] {
        color: #f5ff00 !important;
        text-shadow: 0 0 8px rgba(245, 255, 0, 0.5);
    }
    .stTabs [data-baseweb="tab-highlight"] {
        background-color: #f5ff00 !important;
        box-shadow: 0 0 10px 1px rgba(245, 255, 0, 0.7);
        height: 3px !important;
    }

    /* Metric cards - glassmorphism with layered depth shadows */
    div[data-testid="stMetric"] {
        background-color: rgba(10, 10, 10, 0.55);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 0, 230, 0.4);
        border-radius: 12px; padding: 14px 16px;
        box-shadow:
            0 6px 14px rgba(0, 0, 0, 0.65),
            0 0 14px rgba(255, 0, 230, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
    }
    div[data-testid="stMetric"]:hover {
        transform: translateY(-3px);
        border-color: rgba(0, 247, 255, 0.6);
        box-shadow:
            0 12px 24px rgba(0, 0, 0, 0.75),
            0 0 22px rgba(0, 247, 255, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }
    div[data-testid="stMetricLabel"] {
        color: #ff00e6 !important; font-weight: 700 !important;
        letter-spacing: 0.5px; font-size: 0.78rem !important;
        text-transform: uppercase;
    }
    div[data-testid="stMetricValue"] {
        color: #f1f5f9 !important; font-family: 'Rajdhani', sans-serif !important;
        font-weight: 700 !important;
    }

    /* Popular ticker pill buttons - glassmorphism */
    .stButton button {
        font-family: 'Orbitron', sans-serif !important;
        font-size: 0.78rem !important;
        border-radius: 20px !important;
        border: 1px solid rgba(0, 247, 255, 0.5) !important;
        background-color: rgba(10, 10, 10, 0.5) !important;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: #00f7ff !important;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 247, 255, 0.15);
        transition: all 0.15s ease;
    }
    .stButton button:hover {
        border-color: #f5ff00 !important; color: #f5ff00 !important;
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.6), 0 0 16px rgba(245, 255, 0, 0.3);
        transform: translateY(-2px) scale(1.02);
    }
    .stButton button:disabled {
        border-color: rgba(100, 100, 100, 0.3) !important;
        color: #4d5568 !important; box-shadow: none;
    }

    /* Info/success/error boxes - glass style to match */
    div[data-testid="stAlert"] {
        background-color: rgba(10, 10, 10, 0.55) !important;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: 10px;
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.6);
    }

    /* "MATCH FOUND" success badge - subtle pulse */
    div[data-testid="stAlert"][data-baseweb="notification"] p { font-weight: 700; letter-spacing: 0.5px; }
    div.stAlert:has(svg[title="Success"]) {
        animation: matchPulse 1.8s ease-in-out infinite;
        border: 1px solid rgba(57, 255, 20, 0.5) !important;
    }
    @keyframes matchPulse {
        0%, 100% { box-shadow: 0 6px 14px rgba(0,0,0,0.6), 0 0 6px rgba(57,255,20,0.25); }
        50% { box-shadow: 0 6px 14px rgba(0,0,0,0.6), 0 0 16px rgba(57,255,20,0.5); }
    }

    /* Select boxes / multiselect - glass + neon border on focus */
    div[data-baseweb="select"] > div {
        background-color: rgba(10, 10, 10, 0.6) !important;
        border-color: rgba(0, 247, 255, 0.35) !important;
        border-radius: 10px !important;
    }
    div[data-baseweb="select"]:focus-within > div { border-color: #f5ff00 !important; }
    span[data-baseweb="tag"] {
        background-color: rgba(255, 0, 230, 0.18) !important;
        border: 1px solid rgba(255, 0, 230, 0.5) !important;
        border-radius: 14px !important;
    }

    /* Dividers - neon gradient line instead of plain gray */
    hr {
        border: none !important;
        height: 1px !important;
        background: linear-gradient(90deg, transparent, #00f7ff, #ff00e6, transparent) !important;
        opacity: 0.5 !important;
    }

    /* Dataframes / tables - glass container with neon border */
    div[data-testid="stDataFrame"] {
        border: 1px solid rgba(0, 247, 255, 0.25);
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.5);
    }

    /* Header ticker banner text (st.header) */
    div[data-testid="stHeading"] h2 {
        text-shadow: 0 0 10px rgba(0, 247, 255, 0.5) !important;
    }
</style>
""", unsafe_allow_html=True)

@st.cache_resource
def load_store():
    return TickerDataStore()


store = load_store()

st.title("📊 Ticker Metrics Terminal")
st.caption(f"{len(store.get_all_tickers())} tickers loaded  •  Live from Ticker_Data.xlsx")

tab_lookup, tab_compare, tab_risk = st.tabs(["🔍 Ticker Lookup", "📈 Compare Tickers", "⚖️ Risk Groups"])

# ===========================================================================
# TAB 1 - TICKER LOOKUP
# ===========================================================================
with tab_lookup:
    if "selected_ticker" not in st.session_state:
        st.session_state.selected_ticker = None

    if st.session_state.selected_ticker is None:
        st.subheader("Search by ticker symbol or company name")
        options = store.get_display_options()
        choice = st.selectbox(
            "Type to search (e.g. \"Apple\" or \"AAPL\")", options,
            index=None, placeholder="Start typing...", key="lookup_search",
        )
        if choice:
            st.session_state.selected_ticker = store.extract_ticker(choice)
            st.rerun()

        st.markdown("**POPULAR TICKERS**")
        popular = store.get_popular_tickers()
        cols = st.columns(6)
        for i, t in enumerate(popular):
            with cols[i % 6]:
                if st.button(t.split(" ")[0], key=f"pop_{t}", use_container_width=True):
                    st.session_state.selected_ticker = t
                    st.rerun()

    else:
        data = store.get_metrics(st.session_state.selected_ticker)
        if data is None:
            st.error("Ticker not found.")
            st.session_state.selected_ticker = None
        else:
            if st.button("← Back", key="lookup_back"):
                st.session_state.selected_ticker = None
                st.rerun()

            col_title, col_badge = st.columns([4, 1])
            with col_title:
                st.header(data["Ticker"])
            with col_badge:
                st.success("MATCH FOUND")

            c1, c2, c3, c4, c5 = st.columns(5)
            c1.metric("Market Cap", format_currency(data["Market Cap"]))
            c2.metric("Volume", format_number(data["Volume"]))
            c3.metric("Volume (USD)", format_currency(data["Volume in USD"]))
            c4.metric("Beta", format_beta(data["Beta"]))
            c5.metric("Risk Group", str(data["Risk Group"]))

            c6, c7, c8, c9 = st.columns(4)
            c6.metric("Vol 30D", format_percent(data["Historical Volatility 30D"]))
            c7.metric("Vol 60D", format_percent(data["Historical Volatility 60D"]))
            c8.metric("Vol 90D", format_percent(data["Historical Volatility 90D"]))
            c9.metric("Suggested Leverage", f"{data['Suggested Leverage']:.1f}x")

            st.divider()
            market_avg = store.get_market_averages()
            all_caps = store.df["Market Cap"].tolist()

            col_a, col_b = st.columns(2)
            with col_a:
                st.plotly_chart(charts.volatility_chart(data), use_container_width=True)
            with col_b:
                st.plotly_chart(charts.vs_market_chart(data, market_avg), use_container_width=True)

            st.plotly_chart(charts.market_cap_gauge(data, all_caps), use_container_width=True)

# ===========================================================================
# TAB 2 - COMPARE TICKERS
# ===========================================================================
with tab_compare:
    if "compare_tickers" not in st.session_state:
        st.session_state.compare_tickers = []

    st.subheader(f"Add tickers to compare (max {MAX_COMPARE_TICKERS})")
    options = store.get_display_options()
    picked = st.multiselect(
        "Search by ticker symbol or company name",
        options=store.get_all_tickers(),
        default=st.session_state.compare_tickers,
        max_selections=MAX_COMPARE_TICKERS,
        placeholder="e.g. Tesla, NVDA, Apple...",
        key="compare_multiselect",
    )
    st.session_state.compare_tickers = picked

    st.markdown("**POPULAR — CLICK TO ADD**")
    popular = store.get_popular_tickers()
    cols = st.columns(6)
    for i, t in enumerate(popular):
        with cols[i % 6]:
            disabled = t in st.session_state.compare_tickers or len(st.session_state.compare_tickers) >= MAX_COMPARE_TICKERS
            if st.button(t.split(" ")[0], key=f"cmp_pop_{t}", use_container_width=True, disabled=disabled):
                st.session_state.compare_tickers.append(t)
                st.rerun()

    st.divider()

    if len(st.session_state.compare_tickers) < 2:
        st.info(f"Add 2-{MAX_COMPARE_TICKERS} tickers above to see the comparison.")
    else:
        if st.button("← Clear All", key="compare_back"):
            st.session_state.compare_tickers = []
            st.rerun()

        data_list = [store.get_metrics(t) for t in st.session_state.compare_tickers]
        data_list = [d for d in data_list if d]

        metric = st.selectbox(
            "Metric to compare", 
            ["Market Cap", "Volume", "Volume in USD", "Beta", "Risk Score",
             "Historical Volatility 30D", "Historical Volatility 60D", "Historical Volatility 90D"],
            key="compare_metric",
        )

        col_a, col_b = st.columns(2)
        with col_a:
            st.plotly_chart(charts.comparison_chart(data_list, metric), use_container_width=True)
        with col_b:
            st.plotly_chart(charts.radar_chart(data_list), use_container_width=True)

        st.markdown("**Comparison table**")
        table_rows = [{
            "Ticker": d["Ticker"],
            "Market Cap": format_currency(d["Market Cap"]),
            "Volume": format_number(d["Volume"]),
            "Beta": format_beta(d["Beta"]),
            "Risk Score": f"{d['Risk Score']:.3f}",
            "Vol 30D": format_percent(d["Historical Volatility 30D"]),
            "Vol 60D": format_percent(d["Historical Volatility 60D"]),
            "Vol 90D": format_percent(d["Historical Volatility 90D"]),
        } for d in data_list]
        st.dataframe(table_rows, use_container_width=True, hide_index=True)

# ===========================================================================
# TAB 3 - RISK GROUPS
# ===========================================================================
with tab_risk:
    st.info(
        "Every ticker is scored 0 (safest) to 1 (riskiest) using Market Cap (40%), "
        "Volume in USD (30%), Beta (20%), and 60D Volatility (10%) - then grouped into "
        "5 tiers using fixed score thresholds, so group sizes reflect the real data. "
        "Safer tiers get a higher suggested leverage; riskier tiers get less."
    )

    summary = store.get_risk_group_summary()
    col_a, col_b = st.columns(2)
    with col_a:
        st.plotly_chart(charts.risk_group_bar_chart(summary), use_container_width=True)
    with col_b:
        st.plotly_chart(charts.leverage_by_group_chart(summary), use_container_width=True)

    st.divider()
    group_name = st.selectbox("Browse tickers in group:", RISK_GROUPS, key="risk_group_select")

    subset = store.get_tickers_in_group(group_name)
    order_note = "riskiest-first" if group_name in ("Risky", "Very Risky") else "safest-first"
    st.caption(f"{len(subset)} tickers in this group, shown {order_note}.")

    display_df = subset.copy()
    display_df["Market Cap"] = display_df["Market Cap"].apply(format_currency)
    display_df["Volume in USD"] = display_df["Volume in USD"].apply(format_currency)
    display_df["Beta"] = display_df["Beta"].apply(format_beta)
    display_df["Historical Volatility 60D"] = display_df["Historical Volatility 60D"].apply(format_percent)
    display_df["Risk Score"] = display_df["Risk Score"].apply(lambda v: f"{v:.3f}")
    display_df["Suggested Leverage"] = display_df["Suggested Leverage"].apply(lambda v: f"{v:.1f}x")

    # height=500 gives a scrollable window over ALL rows - no custom scroll code needed
    st.dataframe(display_df, use_container_width=True, hide_index=True, height=500)
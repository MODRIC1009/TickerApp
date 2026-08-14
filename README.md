# 📊 Ticker Metrics Terminal

An interactive equity analytics tool that transforms a raw Excel dataset of **1,591 tickers** into a searchable, comparable, and risk-classified dashboard — built entirely in Python.

Look up any ticker by symbol or company name, compare multiple tickers side-by-side across any metric, and browse an automated risk classification system that scores every ticker and suggests a corresponding leverage figure.

---

## ✨ Features

### 🔍 Ticker Lookup
Search by ticker symbol (`AAPL`) or common company name (`Apple`) and instantly view:
- Market Cap, Volume, Volume (USD), Beta, Risk Group, and Suggested Leverage as metric cards
- An interactive historical volatility chart (30D / 60D / 90D)
- A "this ticker vs. market average" comparison chart
- A market-cap percentile gauge showing where the ticker ranks among all 1,591 tickers

A curated set of **Popular Tickers** is shown as one-click shortcuts before any search is typed.

### 📈 Compare Tickers
Select 2–10 tickers (searchable by symbol or name) and compare them on any single metric:
- A grouped bar chart of the chosen metric across all selected tickers
- A radar chart showing each ticker's normalized risk profile shape (Beta, Risk Score, Volatility 30D/60D/90D)
- A full side-by-side comparison table

### ⚖️ Risk Groups
Every ticker is automatically scored and classified into one of five risk tiers — **Very Stable → Stable → Moderate → Risky → Very Risky** — using a transparent, weighted methodology, with a data-driven suggested leverage figure per tier.

---

## 🧮 Risk Classification Methodology

Each ticker is scored on a **0.0 (safest) to 1.0 (riskiest)** scale using percentile-ranked, weighted metrics:

Risk Score = 0.40 × (1 − Market Cap percentile)
+ 0.30 × (1 − Volume in USD percentile)
+ 0.20 × (Beta percentile)
+ 0.10 × (Volatility 60D percentile)


Market Cap and Volume are inverted since larger, more liquid companies are inherently more stable. Tickers are then bucketed into fixed risk-score thresholds (not artificial equal-sized groups), so tier sizes reflect the real distribution of the data.

Suggested Leverage is derived with a simple linear formula:

Suggested Leverage = 10.0 − (Risk Score × 9.0)


Safer tickers (lower Risk Score) get a higher leverage ceiling; riskier tickers get a lower one.

> **Note:** This is a data-driven analytical heuristic for internal decision support, not a certified financial risk model or licensed investment advice.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Language | Python 3.13 |
| Data processing | pandas, openpyxl |
| Web UI | Streamlit |
| Charts | Plotly (interactive) |
| Desktop UI (legacy) | Tkinter + Matplotlib |
| Version control | Git & GitHub |

---

## 📁 Project Structure

TickerApp/
├── app.py # Streamlit web app (main entry point)
├── main.py # Tkinter desktop app entry point
├── ui.py # Tkinter desktop UI
├── charts.py # Matplotlib chart builders (desktop)
├── charts_plotly.py # Plotly interactive chart builders (web)
├── data_loader.py # Excel loading, search, and lookup logic
├── risk_classifier.py # Risk scoring, grouping, and leverage engine
├── company_names.py # Company name → ticker symbol mapping
├── formatters.py # Number formatting helpers
├── requirements.txt # Python dependencies
└── Ticker_Data.xlsx # Source dataset


---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- pip

### Installation

```bash
git clone https://github.com/MODRIC1009/TickerApp.git
cd TickerApp
pip install -r requirements.txt
```

### Run the web app (Streamlit)

```bash
streamlit run app.py
```

This opens the app automatically in your browser at `http://localhost:8501`.

### Run the desktop app (Tkinter)

```bash
python main.py
```

---

## 📊 Dataset

The application reads from `Ticker_Data.xlsx` (sheet: `Ticker Metrics`), containing one row per ticker:

| Column | Description |
|---|---|
| Ticker | Symbol and exchange, e.g. `NVDA US Equity` |
| Volume | Trading volume (shares) |
| Volume in USD | Trading volume in US Dollars |
| Market Cap | Market capitalization (USD) |
| Historical Volatility 30D / 60D / 90D | Annualized volatility over each window |
| Beta | Systematic risk relative to the market |

**1,591 unique tickers** across global equities and exchanges.

---

## 🔮 Future Enhancements

- Live/real-time market data via an external API
- Historical price trend charts
- In-app adjustable risk-scoring weights and leverage range
- Export comparison and risk-group tables to Excel/PDF

---

## 👤 Author

**Nihal**
B.Tech IT Student

---

"""
data_loader.py
----------------
This file is responsible for ONE job only: reading Ticker_Data.xlsx
and handing back clean, ready-to-use data to the rest of the app.

Keeping this separate from the UI code means:
- If you ever change the Excel file's location or format, you only
  edit THIS file.
- The UI code never needs to know how the data is stored.
"""

import os
import pandas as pd
from risk_classifier import classify_all_tickers, get_group_summary, RISK_GROUPS
from company_names import match_root_from_name, POPULAR_TICKER_ROOTS, build_root_to_name

# The Excel file must sit in the same folder as this script.
EXCEL_FILE_NAME = "Ticker_Data.xlsx"
SHEET_NAME = "Ticker Metrics"


class TickerDataStore:
    """
    Loads the Excel sheet once into memory and provides fast lookups.
    """

    def __init__(self, excel_path: str = None):
        if excel_path is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            excel_path = os.path.join(base_dir, EXCEL_FILE_NAME)

        if not os.path.exists(excel_path):
            raise FileNotFoundError(
                f"Could not find '{EXCEL_FILE_NAME}'. "
                f"Make sure it is placed in: {os.path.dirname(excel_path)}"
            )

        self.excel_path = excel_path
        self.df = self._load_data()
        self.df = classify_all_tickers(self.df)

    def _load_data(self) -> pd.DataFrame:
        df = pd.read_excel(self.excel_path, sheet_name=SHEET_NAME)
        df = df.dropna(subset=["Ticker"])
        df["Ticker"] = df["Ticker"].astype(str).str.strip()
        df["Ticker_Search"] = df["Ticker"].str.upper()
        return df

    def get_all_tickers(self) -> list:
        return sorted(self.df["Ticker"].unique().tolist())

    def search_tickers(self, partial_text: str, limit: int = 15) -> list:
        if not partial_text:
            return []
        text_upper = partial_text.upper().strip()
        matches = self.df[self.df["Ticker_Search"].str.contains(text_upper, na=False)]
        results = matches["Ticker"].tolist()

        name_root = match_root_from_name(partial_text)
        if name_root:
            name_matches = self.df[self.df["Ticker_Search"].str.startswith(name_root + " ")]
            for t in name_matches["Ticker"].tolist():
                if t not in results:
                    results.insert(0, t)

        return results[:limit]

    def get_popular_tickers(self, limit: int = 12) -> list:
        found = []
        for root in POPULAR_TICKER_ROOTS:
            matches = self.df[self.df["Ticker_Search"].str.startswith(root + " ")]
            if not matches.empty:
                found.append(matches.iloc[0]["Ticker"])
            if len(found) >= limit:
                return found[:limit]

        if len(found) < limit:
            top_by_cap = self.df.sort_values("Market Cap", ascending=False)["Ticker"].tolist()
            for t in top_by_cap:
                if t not in found:
                    found.append(t)
                if len(found) >= limit:
                    break
        return found[:limit]

    def get_metrics(self, ticker: str) -> dict:
        ticker_clean = ticker.upper().strip()
        row = self.df[self.df["Ticker_Search"] == ticker_clean]

        if row.empty:
            return None

        row = row.iloc[0]
        return {
            "Ticker": row["Ticker"],
            "Volume": row["Volume"],
            "Volume in USD": row["Volume in USD"],
            "Market Cap": row["Market Cap"],
            "Historical Volatility 30D": row["Historical Volatility 30D"],
            "Historical Volatility 60D": row["Historical Volatility 60D"],
            "Historical Volatility 90D": row["Historical Volatility 90D"],
            "Beta": row["Beta"],
            "Risk Score": row["Risk Score"],
            "Risk Group": row["Risk Group"],
            "Suggested Leverage": row["Suggested Leverage"],
        }

    def reload(self):
        self.df = self._load_data()
        self.df = classify_all_tickers(self.df)

    def get_market_averages(self) -> dict:
        return {
            "Market Cap": self.df["Market Cap"].mean(),
            "Volume": self.df["Volume"].mean(),
            "Volume in USD": self.df["Volume in USD"].mean(),
            "Historical Volatility 30D": self.df["Historical Volatility 30D"].mean(),
            "Historical Volatility 60D": self.df["Historical Volatility 60D"].mean(),
            "Historical Volatility 90D": self.df["Historical Volatility 90D"].mean(),
            "Beta": self.df["Beta"].mean(),
        }

    def get_risk_group_summary(self) -> pd.DataFrame:
        return get_group_summary(self.df)

    def get_tickers_in_group(self, group_name: str, limit: int = None) -> pd.DataFrame:
        subset = self.df[self.df["Risk Group"] == group_name]

        descending_groups = {"Risky", "Very Risky"}
        ascending = group_name not in descending_groups
        subset = subset.sort_values("Risk Score", ascending=ascending)

        if limit:
            subset = subset.head(limit)
        return subset[[
            "Ticker", "Market Cap", "Volume in USD", "Beta",
            "Historical Volatility 60D", "Risk Score", "Suggested Leverage",
        ]]

    def get_display_options(self) -> list:
        """
        Returns a list of strings like "AAPL US Equity — Apple" for well
        known tickers (falls back to just the ticker symbol for the rest).
        Used to power Streamlit's searchable dropdowns so typing a company
        name OR a ticker symbol both work.
        """
        root_to_name = build_root_to_name()
        options = []
        for ticker in self.get_all_tickers():
            root = ticker.split(" ")[0]
            name = root_to_name.get(root)
            options.append(f"{ticker} — {name}" if name else ticker)
        return sorted(options)

    @staticmethod
    def extract_ticker(display_option: str) -> str:
        """Turns "AAPL US Equity — Apple" back into "AAPL US Equity"."""
        return display_option.split(" — ")[0].strip()
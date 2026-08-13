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
from company_names import match_root_from_name, POPULAR_TICKER_ROOTS

# The Excel file must sit in the same folder as this script.
EXCEL_FILE_NAME = "Ticker_Data.xlsx"
SHEET_NAME = "Ticker Metrics"


class TickerDataStore:
    """
    Loads the Excel sheet once into memory and provides fast lookups.
    """

    def __init__(self, excel_path: str = None):
        if excel_path is None:
            # Build the path relative to THIS file, so the app works
            # no matter where you run it from.
            base_dir = os.path.dirname(os.path.abspath(__file__))
            excel_path = os.path.join(base_dir, EXCEL_FILE_NAME)

        if not os.path.exists(excel_path):
            raise FileNotFoundError(
                f"Could not find '{EXCEL_FILE_NAME}'. "
                f"Make sure it is placed in: {os.path.dirname(excel_path)}"
            )

        self.excel_path = excel_path
        self.df = self._load_data()
        # Compute risk group + suggested leverage for every ticker, once.
        self.df = classify_all_tickers(self.df)

    def _load_data(self) -> pd.DataFrame:
        """Reads the 'Ticker Metrics' sheet into a pandas DataFrame."""
        df = pd.read_excel(self.excel_path, sheet_name=SHEET_NAME)

        # Clean up: remove rows with no ticker, strip whitespace
        df = df.dropna(subset=["Ticker"])
        df["Ticker"] = df["Ticker"].astype(str).str.strip()

        # Keep a normalized (uppercase, no spaces issues) column for
        # searching, without touching the original display column.
        df["Ticker_Search"] = df["Ticker"].str.upper()

        return df

    def get_all_tickers(self) -> list:
        """Returns a sorted list of every ticker symbol (for autocomplete)."""
        return sorted(self.df["Ticker"].unique().tolist())

    def search_tickers(self, partial_text: str, limit: int = 15) -> list:
        """
        Returns tickers that CONTAIN the given text (case-insensitive) in
        their symbol, OR whose ticker root matches a known company name
        (e.g. typing "apple" finds "AAPL US Equity").
        """
        if not partial_text:
            return []
        text_upper = partial_text.upper().strip()
        matches = self.df[self.df["Ticker_Search"].str.contains(text_upper, na=False)]
        results = matches["Ticker"].tolist()

        # Also try matching by company name (e.g. "apple" -> "AAPL")
        name_root = match_root_from_name(partial_text)
        if name_root:
            name_matches = self.df[self.df["Ticker_Search"].str.startswith(name_root + " ")]
            for t in name_matches["Ticker"].tolist():
                if t not in results:
                    results.insert(0, t)  # prioritize exact name matches at the top

        return results[:limit]

    def get_popular_tickers(self, limit: int = 12) -> list:
        """
        Returns a short list of well-known tickers to show BEFORE the user
        types anything, so people unfamiliar with ticker symbols still see
        useful starting points. Falls back to the biggest tickers by
        Market Cap if a popular symbol isn't present in this dataset.
        """
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
        """
        Returns a dictionary of metrics for an EXACT ticker match.
        Returns None if the ticker isn't found.
        """
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
        """Re-reads the Excel file from disk (call this if the file changed)."""
        self.df = self._load_data()
        self.df = classify_all_tickers(self.df)

    def get_market_averages(self) -> dict:
        """
        Returns the average of each numeric metric across ALL tickers.
        Used to show how a single ticker compares to the overall market.
        """
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
        """Returns a small table: ticker count + averages per risk group."""
        return get_group_summary(self.df)

    def get_tickers_in_group(self, group_name: str, limit: int = None) -> pd.DataFrame:
        """
        Returns all tickers belonging to a given Risk Group, ordered so the
        most representative extreme of that tier appears first:
          - Safer tiers (Very Stable, Stable, Moderate) -> lowest Risk
            Score first (safest of the group at the top).
          - Riskier tiers (Risky, Very Risky) -> highest Risk Score first
            (riskiest of the group at the top).
        """
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
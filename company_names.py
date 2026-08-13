"""
company_names.py
----------------
The Excel file only has ticker symbols (e.g. "NVDA US Equity"), not full
company names. Most people know "Apple" or "Nvidia", not "AAPL US Equity".
This file maps common company names to their ticker ROOT symbol, so typing
a name still finds the right ticker.

To add more companies: add a line "companyname": "TICKERROOT" below.
Use lowercase for the name (matching is case-insensitive).
"""

COMPANY_NAME_MAP = {
    "apple": "AAPL", "nvidia": "NVDA", "google": "GOOGL", "alphabet": "GOOGL",
    "amazon": "AMZN", "microsoft": "MSFT", "tesla": "TSLA", "meta": "META",
    "facebook": "META", "amd": "AMD", "johnson & johnson": "JNJ",
    "johnson and johnson": "JNJ", "exxon": "XOM", "exxonmobil": "XOM",
    "aramco": "ARAMCO", "berkshire": "BRK", "procter & gamble": "PG",
    "procter and gamble": "PG", "shell": "SHEL", "costco": "COST",
    "netflix": "NFLX", "visa": "V", "mastercard": "MA", "walmart": "WMT",
    "jpmorgan": "JPM", "jp morgan": "JPM", "bank of america": "BAC",
    "coca cola": "KO", "coca-cola": "KO", "pepsi": "PEP", "pepsico": "PEP",
    "disney": "DIS", "intel": "INTC", "qualcomm": "QCOM", "oracle": "ORCL",
    "salesforce": "CRM", "adobe": "ADBE", "paypal": "PYPL", "boeing": "BA",
    "chevron": "CVX", "pfizer": "PFE", "merck": "MRK", "abbvie": "ABBV",
    "home depot": "HD", "mcdonalds": "MCD", "mcdonald's": "MCD", "nike": "NKE",
    "starbucks": "SBUX", "ibm": "IBM", "cisco": "CSCO", "broadcom": "AVGO",
    "texas instruments": "TXN", "goldman sachs": "GS", "morgan stanley": "MS",
    "american express": "AXP", "verizon": "VZ", "at&t": "T", "comcast": "CMCSA",
    "ups": "UPS", "fedex": "FDX", "3m": "MMM", "caterpillar": "CAT",
    "honeywell": "HON", "general electric": "GE", "ford": "F",
    "general motors": "GM",
}

# Tickers shown as "Popular" when no search has been typed yet, in order.
POPULAR_TICKER_ROOTS = [
    "NVDA", "AAPL", "MSFT", "GOOGL", "AMZN", "META",
    "TSLA", "AMD", "JPM", "JNJ", "XOM", "V",
]


def match_root_from_name(text: str):
    """If `text` matches (or is contained in) a known company name, return its ticker root."""
    text = text.lower().strip()
    if not text:
        return None
    for name, root in COMPANY_NAME_MAP.items():
        if text in name or name in text:
            return root
    return None
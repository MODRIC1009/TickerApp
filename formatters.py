"""
formatters.py
----------------
Small helper functions that turn raw numbers (e.g. 5419832000000)
into readable text (e.g. "$5.42T"). Keeping these separate keeps
ui.py focused only on layout/design, not math.
"""


def format_large_number(value) -> str:
    """Turns a big number into a readable form like 1.2K / 3.4M / 5.6B / 7.8T"""
    if value is None:
        return "N/A"
    try:
        value = float(value)
    except (ValueError, TypeError):
        return "N/A"

    abs_value = abs(value)
    if abs_value >= 1_000_000_000_000:
        return f"{value / 1_000_000_000_000:.2f}T"
    elif abs_value >= 1_000_000_000:
        return f"{value / 1_000_000_000:.2f}B"
    elif abs_value >= 1_000_000:
        return f"{value / 1_000_000:.2f}M"
    elif abs_value >= 1_000:
        return f"{value / 1_000:.2f}K"
    else:
        return f"{value:.2f}"


def format_currency(value) -> str:
    """Formats a number as a dollar amount, e.g. $5.42T"""
    formatted = format_large_number(value)
    return "N/A" if formatted == "N/A" else f"${formatted}"


def format_percent(value) -> str:
    """Formats a raw volatility number as a percentage, e.g. 39.90%"""
    if value is None:
        return "N/A"
    try:
        return f"{float(value):.2f}%"
    except (ValueError, TypeError):
        return "N/A"


def format_number(value) -> str:
    """Formats plain numbers with thousand separators, e.g. 105,669,440"""
    if value is None:
        return "N/A"
    try:
        return f"{float(value):,.2f}"
    except (ValueError, TypeError):
        return "N/A"


def format_beta(value) -> str:
    """Formats beta to 2 decimal places, e.g. 1.65"""
    if value is None:
        return "N/A"
    try:
        return f"{float(value):.2f}"
    except (ValueError, TypeError):
        return "N/A"

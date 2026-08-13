"""
ui.py
----------------
Builds the full visual application:

TAB 1 - "Lookup"   : search one ticker (by symbol OR company name), see
                      metric cards + charts. Shows Popular Tickers first.
TAB 2 - "Compare"  : pick 2-10 tickers, see them charted side-by-side.
                      Shows Popular Tickers as quick-add before you search.
TAB 3 - "Risk Groups": every ticker auto-scored and grouped into 5 tiers.

Uses Tkinter for layout/widgets and matplotlib (embedded) for charts.
Long results areas (Compare, Risk Groups) are wrapped in a scrollable
canvas so nothing gets cut off, with a scrollbar on the right.
"""

import tkinter as tk
from tkinter import ttk, font as tkfont
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg

from data_loader import TickerDataStore
from formatters import format_currency, format_number, format_percent, format_beta
import charts

# ---------------------------------------------------------------------------
# COLOR PALETTE  (edit these to re-theme the whole app)
# ---------------------------------------------------------------------------
COLOR_BG = "#0f172a"
COLOR_PANEL = "#1e293b"
COLOR_PANEL_HOVER = "#25344d"
COLOR_ACCENT = "#38bdf8"
COLOR_ACCENT_DIM = "#0ea5e9"
COLOR_TEXT_PRIMARY = "#f1f5f9"
COLOR_TEXT_SECONDARY = "#94a3b8"
COLOR_SUCCESS = "#4ade80"
COLOR_ERROR = "#f87171"
COLOR_BORDER = "#334155"

COMPARE_METRICS = [
    "Market Cap", "Volume", "Volume in USD", "Beta", "Risk Score",
    "Historical Volatility 30D", "Historical Volatility 60D", "Historical Volatility 90D",
]

MAX_COMPARE_TICKERS = 10


class ScrollableArea(tk.Frame):
    """
    A reusable vertically-scrolling container. Put widgets inside
    `self.body` (a Frame) and they'll scroll if they overflow, with a
    scrollbar on the right edge. Mouse wheel works while hovering over it.
    """

    def __init__(self, parent, bg=COLOR_BG):
        super().__init__(parent, bg=bg)

        self.canvas = tk.Canvas(self, bg=bg, highlightthickness=0)
        self.scrollbar = tk.Scrollbar(self, orient="vertical", command=self.canvas.yview)
        self.body = tk.Frame(self.canvas, bg=bg)

        self.body.bind("<Configure>", lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all")))
        self._window = self.canvas.create_window((0, 0), window=self.body, anchor="nw")
        self.canvas.bind("<Configure>", lambda e: self.canvas.itemconfig(self._window, width=e.width))
        self.canvas.configure(yscrollcommand=self.scrollbar.set)

        self.canvas.pack(side="left", fill="both", expand=True)
        self.scrollbar.pack(side="right", fill="y")

        self.canvas.bind("<Enter>", lambda e: self.canvas.bind_all("<MouseWheel>", self._on_wheel))
        self.canvas.bind("<Leave>", lambda e: self.canvas.unbind_all("<MouseWheel>"))

    def _on_wheel(self, event):
        self.canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")

    def clear(self):
        for w in self.body.winfo_children():
            w.destroy()
        self.canvas.yview_moveto(0)


class TickerApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Ticker Metrics Terminal")
        self.root.geometry("1180x760")
        self.root.minsize(1000, 680)
        self.root.configure(bg=COLOR_BG)

        self.store = TickerDataStore()
        self.market_avg = self.store.get_market_averages()
        self.all_market_caps = self.store.df["Market Cap"].tolist()

        self._setup_fonts()
        self._setup_styles()
        self._build_header()
        self._build_tabs()

    # ------------------------------------------------------------------
    def _setup_fonts(self):
        self.font_title = tkfont.Font(family="Segoe UI", size=20, weight="bold")
        self.font_subtitle = tkfont.Font(family="Segoe UI", size=10)
        self.font_input = tkfont.Font(family="Segoe UI", size=13)
        self.font_label = tkfont.Font(family="Segoe UI", size=9, weight="bold")
        self.font_value = tkfont.Font(family="Segoe UI", size=16, weight="bold")
        self.font_ticker_big = tkfont.Font(family="Segoe UI", size=22, weight="bold")
        self.font_status = tkfont.Font(family="Segoe UI", size=10)

    def _setup_styles(self):
        style = ttk.Style()
        style.theme_use("default")
        style.configure("TNotebook", background=COLOR_BG, borderwidth=0)
        style.configure("TNotebook.Tab", background=COLOR_PANEL, foreground=COLOR_TEXT_SECONDARY,
                         padding=(20, 10), font=("Segoe UI", 10, "bold"))
        style.map("TNotebook.Tab",
                   background=[("selected", COLOR_ACCENT_DIM)],
                   foreground=[("selected", "#ffffff")])
        style.configure("TFrame", background=COLOR_BG)

    # ------------------------------------------------------------------
    # HEADER
    # ------------------------------------------------------------------
    def _build_header(self):
        header = tk.Frame(self.root, bg=COLOR_BG)
        header.pack(fill="x", padx=36, pady=(24, 10))

        tk.Label(header, text="Ticker Metrics Terminal", font=self.font_title,
                 fg=COLOR_TEXT_PRIMARY, bg=COLOR_BG).pack(anchor="w")

        tk.Label(header,
                 text=f"{len(self.store.get_all_tickers())} tickers loaded  •  Live from Ticker_Data.xlsx",
                 font=self.font_subtitle, fg=COLOR_TEXT_SECONDARY, bg=COLOR_BG).pack(anchor="w", pady=(4, 0))

    # ------------------------------------------------------------------
    # TABS
    # ------------------------------------------------------------------
    def _build_tabs(self):
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill="both", expand=True, padx=36, pady=(10, 24))

        self.tab_lookup = tk.Frame(self.notebook, bg=COLOR_BG)
        self.tab_compare = tk.Frame(self.notebook, bg=COLOR_BG)
        self.tab_risk = tk.Frame(self.notebook, bg=COLOR_BG)

        self.notebook.add(self.tab_lookup, text="  Ticker Lookup  ")
        self.notebook.add(self.tab_compare, text="  Compare Tickers  ")
        self.notebook.add(self.tab_risk, text="  Risk Groups  ")

        self._build_lookup_tab()
        self._build_compare_tab()
        self._build_risk_tab()

    # ------------------------------------------------------------------
    # SHARED: a clickable "popular ticker" pill
    # ------------------------------------------------------------------
    def _make_popular_pill(self, parent, ticker, command):
        pill = tk.Label(parent, text=ticker, font=("Segoe UI", 9, "bold"), fg=COLOR_TEXT_PRIMARY,
                         bg=COLOR_PANEL, padx=14, pady=8, cursor="hand2",
                         highlightthickness=1, highlightbackground=COLOR_BORDER)
        pill.pack(side="left", padx=5, pady=5)
        pill.bind("<Button-1>", lambda e: command(ticker))
        pill.bind("<Enter>", lambda e: pill.config(bg=COLOR_PANEL_HOVER, fg=COLOR_ACCENT))
        pill.bind("<Leave>", lambda e: pill.config(bg=COLOR_PANEL, fg=COLOR_TEXT_PRIMARY))
        return pill

    def _make_popular_section(self, parent, on_click):
        """A 'Popular Tickers' block of clickable pills, wrapped in a Frame."""
        wrap = tk.Frame(parent, bg=COLOR_BG)
        tk.Label(wrap, text="POPULAR TICKERS", font=self.font_label,
                 fg=COLOR_TEXT_SECONDARY, bg=COLOR_BG).pack(anchor="w", pady=(0, 8))
        pills = tk.Frame(wrap, bg=COLOR_BG)
        pills.pack(anchor="w")
        for t in self.store.get_popular_tickers():
            self._make_popular_pill(pills, t, on_click)
        return wrap

    # ====================================================================
    # TAB 1 - LOOKUP
    # ====================================================================
    def _build_lookup_tab(self):
        container = self.tab_lookup

        search_area = tk.Frame(container, bg=COLOR_BG)
        search_area.pack(fill="x", pady=(16, 0))

        search_wrap = tk.Frame(search_area, bg=COLOR_PANEL, highlightthickness=1,
                                highlightbackground=COLOR_BORDER, highlightcolor=COLOR_ACCENT)
        search_wrap.pack(fill="x")

        self.search_var = tk.StringVar()
        self.search_var.trace_add("write", self._on_type)

        entry = tk.Entry(search_wrap, textvariable=self.search_var, font=self.font_input,
                          fg=COLOR_TEXT_PRIMARY, bg=COLOR_PANEL, insertbackground=COLOR_ACCENT, relief="flat")
        entry.pack(fill="x", ipady=12, padx=16)
        entry.bind("<Return>", lambda e: self._search_exact())
        self.search_entry = entry

        tk.Label(search_area, text="Search by ticker symbol or company name (e.g. \"Apple\" or \"AAPL\")",
                 font=("Segoe UI", 8), fg=COLOR_TEXT_SECONDARY, bg=COLOR_BG).pack(anchor="w", pady=(4, 0))

        self.suggestions_frame = tk.Frame(search_area, bg=COLOR_PANEL, highlightthickness=1,
                                           highlightbackground=COLOR_BORDER)
        self.suggestions_list = tk.Listbox(self.suggestions_frame, font=self.font_subtitle, height=6,
                                            bg=COLOR_PANEL, fg=COLOR_TEXT_PRIMARY, relief="flat",
                                            selectbackground=COLOR_ACCENT_DIM, selectforeground="#ffffff",
                                            activestyle="none", highlightthickness=0, bd=0)
        self.suggestions_list.pack(fill="both", expand=True, padx=2, pady=2)
        self.suggestions_list.bind("<<ListboxSelect>>", self._on_suggestion_click)

        self.status_label = tk.Label(search_area, text="", font=self.font_status, fg=COLOR_ERROR, bg=COLOR_BG)
        self.status_label.pack(anchor="w", pady=(6, 0))

        self.lookup_results = tk.Frame(container, bg=COLOR_BG)
        self.lookup_results.pack(fill="both", expand=True, pady=(14, 0))

        self._show_lookup_placeholder()

    def _on_type(self, *args):
        text = self.search_var.get()
        matches = self.store.search_tickers(text)
        self.suggestions_list.delete(0, tk.END)
        if matches and text:
            for m in matches:
                self.suggestions_list.insert(tk.END, f"  {m}")
            self.suggestions_frame.pack(fill="x", pady=(6, 0))
        else:
            self.suggestions_frame.pack_forget()
        self.status_label.config(text="")

    def _on_suggestion_click(self, event):
        sel = self.suggestions_list.curselection()
        if not sel:
            return
        value = self.suggestions_list.get(sel[0]).strip()
        self.search_var.set(value)
        self.suggestions_frame.pack_forget()
        self._render_lookup(value)

    def _search_exact(self):
        text = self.search_var.get().strip()
        if not text:
            return
        matches = self.store.search_tickers(text, limit=1)
        self.suggestions_frame.pack_forget()
        if matches:
            self._render_lookup(matches[0])
        else:
            self._render_lookup(text)

    def _clear_lookup_results(self):
        for w in self.lookup_results.winfo_children():
            w.destroy()

    def _show_lookup_placeholder(self):
        self._clear_lookup_results()
        wrap = tk.Frame(self.lookup_results, bg=COLOR_BG)
        wrap.pack(fill="both", expand=True)
        tk.Label(wrap, text="Search for a ticker to view metrics and charts",
                 font=self.font_subtitle, fg=COLOR_TEXT_SECONDARY, bg=COLOR_BG).pack(anchor="w", pady=(10, 20))
        self._make_popular_section(wrap, self._on_popular_click).pack(anchor="w")

    def _on_popular_click(self, ticker):
        self._render_lookup(ticker)

    def _back_to_lookup_start(self):
        self.search_var.set("")
        self.status_label.config(text="")
        self._show_lookup_placeholder()

    def _render_lookup(self, ticker_text):
        data = self.store.get_metrics(ticker_text)
        if data is None:
            self.status_label.config(text=f"No exact match for '{ticker_text}'. Pick a suggestion from the list.")
            return

        self._clear_lookup_results()

        banner = tk.Frame(self.lookup_results, bg=COLOR_BG)
        banner.pack(fill="x", pady=(0, 14))
        back_btn = tk.Label(banner, text="← Back", font=self.font_label, fg=COLOR_ACCENT, bg=COLOR_BG, cursor="hand2")
        back_btn.pack(side="left", padx=(0, 14))
        back_btn.bind("<Button-1>", lambda e: self._back_to_lookup_start())
        tk.Label(banner, text=data["Ticker"], font=self.font_ticker_big,
                 fg=COLOR_TEXT_PRIMARY, bg=COLOR_BG).pack(side="left")
        tk.Label(banner, text="MATCH FOUND", font=self.font_label,
                 fg=COLOR_SUCCESS, bg=COLOR_BG).pack(side="right")

        cards_grid = tk.Frame(self.lookup_results, bg=COLOR_BG)
        cards_grid.pack(fill="x")
        cards = [
            ("MARKET CAP", format_currency(data["Market Cap"])),
            ("VOLUME", format_number(data["Volume"])),
            ("VOLUME (USD)", format_currency(data["Volume in USD"])),
            ("BETA", format_beta(data["Beta"])),
            ("VOL 30D", format_percent(data["Historical Volatility 30D"])),
            ("VOL 60D", format_percent(data["Historical Volatility 60D"])),
            ("VOL 90D", format_percent(data["Historical Volatility 90D"])),
            ("RISK GROUP", str(data["Risk Group"])),
            ("SUGGESTED LEVERAGE", f"{data['Suggested Leverage']:.1f}x"),
        ]
        for i in range(9):
            cards_grid.grid_columnconfigure(i, weight=1, uniform="c")
        for i, (label, value) in enumerate(cards):
            self._make_small_card(cards_grid, label, value, 0, i)

        charts_row = tk.Frame(self.lookup_results, bg=COLOR_BG)
        charts_row.pack(fill="both", expand=True, pady=(18, 0))
        charts_row.grid_columnconfigure(0, weight=1, uniform="cc")
        charts_row.grid_columnconfigure(1, weight=1, uniform="cc")

        fig1 = charts.build_volatility_chart(data)
        self._embed_chart(charts_row, fig1, row=0, col=0)

        fig2 = charts.build_vs_market_chart(data, self.market_avg)
        self._embed_chart(charts_row, fig2, row=0, col=1)

        fig3 = charts.build_market_cap_gauge(data, self.all_market_caps)
        gauge_wrap = tk.Frame(self.lookup_results, bg=COLOR_PANEL, highlightthickness=1,
                               highlightbackground=COLOR_BORDER)
        gauge_wrap.pack(fill="x", pady=(14, 0))
        canvas = FigureCanvasTkAgg(fig3, master=gauge_wrap)
        canvas.draw()
        canvas.get_tk_widget().pack(fill="both", expand=True, padx=8, pady=4)

    def _make_small_card(self, parent, label_text, value_text, row, col):
        card = tk.Frame(parent, bg=COLOR_PANEL, highlightthickness=1, highlightbackground=COLOR_BORDER)
        card.grid(row=row, column=col, sticky="nsew", padx=4, pady=4, ipadx=4, ipady=12)
        tk.Label(card, text=label_text, font=("Segoe UI", 8, "bold"), fg=COLOR_ACCENT, bg=COLOR_PANEL).pack(padx=10, pady=(4, 4))
        tk.Label(card, text=value_text, font=("Segoe UI", 12, "bold"), fg=COLOR_TEXT_PRIMARY, bg=COLOR_PANEL).pack(padx=10)

    def _embed_chart(self, parent, fig, row, col):
        wrap = tk.Frame(parent, bg=COLOR_PANEL, highlightthickness=1, highlightbackground=COLOR_BORDER)
        wrap.grid(row=row, column=col, sticky="nsew", padx=6)
        canvas = FigureCanvasTkAgg(fig, master=wrap)
        canvas.draw()
        canvas.get_tk_widget().pack(fill="both", expand=True, padx=6, pady=6)

    # ====================================================================
    # TAB 2 - COMPARE
    # ====================================================================
    def _build_compare_tab(self):
        container = self.tab_compare

        top = tk.Frame(container, bg=COLOR_BG)
        top.pack(fill="x", pady=(16, 10))

        left = tk.Frame(top, bg=COLOR_BG)
        left.pack(side="left", fill="both", expand=True, padx=(0, 10))

        tk.Label(left, text=f"Add ticker to comparison (max {MAX_COMPARE_TICKERS})", font=self.font_label,
                 fg=COLOR_TEXT_SECONDARY, bg=COLOR_BG).pack(anchor="w", pady=(0, 6))

        add_wrap = tk.Frame(left, bg=COLOR_PANEL, highlightthickness=1, highlightbackground=COLOR_BORDER)
        add_wrap.pack(fill="x")
        self.compare_search_var = tk.StringVar()
        self.compare_search_var.trace_add("write", self._on_compare_type)
        add_entry = tk.Entry(add_wrap, textvariable=self.compare_search_var, font=self.font_input,
                              fg=COLOR_TEXT_PRIMARY, bg=COLOR_PANEL, insertbackground=COLOR_ACCENT, relief="flat")
        add_entry.pack(fill="x", ipady=10, padx=14)

        tk.Label(left, text="Symbol or company name works (e.g. \"Tesla\")",
                 font=("Segoe UI", 8), fg=COLOR_TEXT_SECONDARY, bg=COLOR_BG).pack(anchor="w", pady=(4, 0))

        self.compare_suggestions_frame = tk.Frame(left, bg=COLOR_PANEL, highlightthickness=1, highlightbackground=COLOR_BORDER)
        self.compare_suggestions_list = tk.Listbox(self.compare_suggestions_frame, font=self.font_subtitle, height=5,
                                                     bg=COLOR_PANEL, fg=COLOR_TEXT_PRIMARY, relief="flat",
                                                     selectbackground=COLOR_ACCENT_DIM, selectforeground="#ffffff",
                                                     activestyle="none", highlightthickness=0, bd=0)
        self.compare_suggestions_list.pack(fill="both", expand=True, padx=2, pady=2)
        self.compare_suggestions_list.bind("<<ListboxSelect>>", self._on_compare_suggestion_click)

        self.selected_tickers = []
        self.chips_frame = tk.Frame(left, bg=COLOR_BG)
        self.chips_frame.pack(fill="x", pady=(10, 0))

        self.compare_popular_frame = tk.Frame(left, bg=COLOR_BG)
        self.compare_popular_frame.pack(fill="x", pady=(6, 0))
        self._refresh_compare_popular()

        right = tk.Frame(top, bg=COLOR_BG)
        right.pack(side="left", fill="y")

        tk.Label(right, text="Metric to compare", font=self.font_label,
                 fg=COLOR_TEXT_SECONDARY, bg=COLOR_BG).pack(anchor="w", pady=(0, 6))

        self.metric_var = tk.StringVar(value=COMPARE_METRICS[0])
        metric_menu = ttk.Combobox(right, textvariable=self.metric_var, values=COMPARE_METRICS,
                                    state="readonly", width=28, font=self.font_subtitle)
        metric_menu.pack(anchor="w")
        metric_menu.bind("<<ComboboxSelected>>", lambda e: self._render_comparison())

        generate_btn = tk.Button(right, text="Compare Now", font=self.font_label,
                                  bg=COLOR_ACCENT_DIM, fg="#ffffff", activebackground=COLOR_ACCENT,
                                  relief="flat", cursor="hand2", command=self._render_comparison, padx=16, pady=10)
        generate_btn.pack(anchor="w", pady=(16, 0))

        clear_btn = tk.Button(right, text="Clear All", font=self.font_label,
                               bg=COLOR_PANEL, fg=COLOR_TEXT_SECONDARY, activebackground=COLOR_BORDER,
                               relief="flat", cursor="hand2", command=self._clear_comparison, padx=16, pady=10)
        clear_btn.pack(anchor="w", pady=(8, 0))

        self.compare_status = tk.Label(container, text="", font=self.font_status, fg=COLOR_ERROR, bg=COLOR_BG)
        self.compare_status.pack(anchor="w")

        self.compare_scroll = ScrollableArea(container, bg=COLOR_BG)
        self.compare_scroll.pack(fill="both", expand=True, pady=(10, 0))
        self.compare_results = self.compare_scroll.body
        self._show_compare_placeholder()

    def _refresh_compare_popular(self):
        for w in self.compare_popular_frame.winfo_children():
            w.destroy()
        tk.Label(self.compare_popular_frame, text="POPULAR - CLICK TO ADD", font=self.font_label,
                 fg=COLOR_TEXT_SECONDARY, bg=COLOR_BG).pack(anchor="w", pady=(0, 6))
        pills = tk.Frame(self.compare_popular_frame, bg=COLOR_BG)
        pills.pack(anchor="w")
        for t in self.store.get_popular_tickers():
            self._make_popular_pill(pills, t, self._add_ticker_to_compare)

    def _on_compare_type(self, *args):
        text = self.compare_search_var.get()
        matches = self.store.search_tickers(text)
        self.compare_suggestions_list.delete(0, tk.END)
        if matches and text:
            for m in matches:
                self.compare_suggestions_list.insert(tk.END, f"  {m}")
            self.compare_suggestions_frame.pack(fill="x", pady=(6, 0))
        else:
            self.compare_suggestions_frame.pack_forget()

    def _on_compare_suggestion_click(self, event):
        sel = self.compare_suggestions_list.curselection()
        if not sel:
            return
        value = self.compare_suggestions_list.get(sel[0]).strip()
        self.compare_suggestions_frame.pack_forget()
        self.compare_search_var.set("")
        self._add_ticker_to_compare(value)

    def _add_ticker_to_compare(self, value):
        if value in self.selected_tickers:
            self.compare_status.config(text=f"'{value}' is already added.")
            return
        if len(self.selected_tickers) >= MAX_COMPARE_TICKERS:
            self.compare_status.config(text=f"Maximum of {MAX_COMPARE_TICKERS} tickers for comparison.")
            return
        self.selected_tickers.append(value)
        self.compare_status.config(text="")
        self._render_chips()

    def _render_chips(self):
        for w in self.chips_frame.winfo_children():
            w.destroy()
        for ticker in self.selected_tickers:
            chip = tk.Frame(self.chips_frame, bg=COLOR_ACCENT_DIM)
            chip.pack(side="left", padx=(0, 8), pady=4)
            tk.Label(chip, text=ticker, font=("Segoe UI", 9, "bold"), fg="#ffffff",
                     bg=COLOR_ACCENT_DIM).pack(side="left", padx=(10, 4), pady=6)
            remove_btn = tk.Label(chip, text=" x ", font=("Segoe UI", 9, "bold"), fg="#ffffff",
                                   bg=COLOR_ACCENT_DIM, cursor="hand2")
            remove_btn.pack(side="left", padx=(0, 8))
            remove_btn.bind("<Button-1>", lambda e, t=ticker: self._remove_chip(t))

    def _remove_chip(self, ticker):
        self.selected_tickers.remove(ticker)
        self._render_chips()

    def _clear_comparison(self):
        self.selected_tickers = []
        self._render_chips()
        self._show_compare_placeholder()
        self.compare_status.config(text="")

    def _show_compare_placeholder(self):
        self.compare_scroll.clear()
        tk.Label(self.compare_results, text=f"Add 2-{MAX_COMPARE_TICKERS} tickers above, then click 'Compare Now'",
                 font=self.font_subtitle, fg=COLOR_TEXT_SECONDARY, bg=COLOR_BG).pack(anchor="w", pady=20)

    def _render_comparison(self):
        if len(self.selected_tickers) < 2:
            self.compare_status.config(text="Add at least 2 tickers to compare.")
            return

        data_list = []
        for t in self.selected_tickers:
            d = self.store.get_metrics(t)
            if d:
                data_list.append(d)

        if len(data_list) < 2:
            self.compare_status.config(text="Could not find matching data for the selected tickers.")
            return

        self.compare_status.config(text="")
        self.compare_scroll.clear()

        back_btn = tk.Label(self.compare_results, text="← Back", font=self.font_label,
                             fg=COLOR_ACCENT, bg=COLOR_BG, cursor="hand2")
        back_btn.pack(anchor="w", pady=(0, 10))
        back_btn.bind("<Button-1>", lambda e: self._show_compare_placeholder())

        row = tk.Frame(self.compare_results, bg=COLOR_BG)
        row.pack(fill="both", expand=True)
        row.grid_columnconfigure(0, weight=1, uniform="cc")
        row.grid_columnconfigure(1, weight=1, uniform="cc")

        metric = self.metric_var.get()
        fig1 = charts.build_comparison_chart(data_list, metric)
        self._embed_chart(row, fig1, row=0, col=0)

        fig2 = charts.build_radar_chart(data_list)
        self._embed_chart(row, fig2, row=0, col=1)

        table_wrap = tk.Frame(self.compare_results, bg=COLOR_PANEL, highlightthickness=1,
                               highlightbackground=COLOR_BORDER)
        table_wrap.pack(fill="x", pady=(14, 4))
        self._build_comparison_table(table_wrap, data_list)

    def _build_comparison_table(self, parent, data_list):
        headers = ["Ticker", "Market Cap", "Volume", "Beta", "Risk Score", "Vol 30D", "Vol 60D", "Vol 90D"]
        for c, h in enumerate(headers):
            parent.grid_columnconfigure(c, weight=1, uniform="tc")
            tk.Label(parent, text=h, font=self.font_label, fg=COLOR_ACCENT, bg=COLOR_PANEL,
                     anchor="w").grid(row=0, column=c, sticky="ew", padx=10, pady=(10, 6))

        for r, d in enumerate(data_list, start=1):
            values = [
                d["Ticker"],
                format_currency(d["Market Cap"]),
                format_number(d["Volume"]),
                format_beta(d["Beta"]),
                f"{d['Risk Score']:.3f}",
                format_percent(d["Historical Volatility 30D"]),
                format_percent(d["Historical Volatility 60D"]),
                format_percent(d["Historical Volatility 90D"]),
            ]
            for c, v in enumerate(values):
                tk.Label(parent, text=v, font=("Segoe UI", 9), fg=COLOR_TEXT_PRIMARY, bg=COLOR_PANEL,
                         anchor="w").grid(row=r, column=c, sticky="ew", padx=10, pady=6)

    # ====================================================================
    # TAB 3 - RISK GROUPS
    # ====================================================================
    def _build_risk_tab(self):
        container = self.tab_risk

        info = tk.Frame(container, bg=COLOR_PANEL, highlightthickness=1, highlightbackground=COLOR_BORDER)
        info.pack(fill="x", pady=(16, 14))
        tk.Label(
            info,
            text=("Every ticker is scored 0 (safest) to 1 (riskiest) using Market Cap (40%), "
                  "Volume in USD (30%), Beta (20%), and 60D Volatility (10%) - then grouped into "
                  "5 tiers using fixed score thresholds, so group sizes reflect the real data. "
                  "Safer tiers get a higher suggested leverage; riskier tiers get less."),
            font=self.font_subtitle, fg=COLOR_TEXT_SECONDARY, bg=COLOR_PANEL,
            wraplength=1000, justify="left",
        ).pack(padx=16, pady=12, anchor="w")

        summary = self.store.get_risk_group_summary()
        charts_row = tk.Frame(container, bg=COLOR_BG)
        charts_row.pack(fill="both", pady=(0, 14))
        charts_row.grid_columnconfigure(0, weight=1, uniform="rc")
        charts_row.grid_columnconfigure(1, weight=1, uniform="rc")
        self._embed_chart(charts_row, charts.build_risk_group_bar_chart(summary), row=0, col=0)
        self._embed_chart(charts_row, charts.build_leverage_by_group_chart(summary), row=0, col=1)

        selector_row = tk.Frame(container, bg=COLOR_BG)
        selector_row.pack(fill="x", pady=(4, 8))
        tk.Label(selector_row, text="Browse tickers in group:", font=self.font_label,
                 fg=COLOR_TEXT_SECONDARY, bg=COLOR_BG).pack(side="left", padx=(0, 10))

        from risk_classifier import RISK_GROUPS
        self.risk_group_var = tk.StringVar(value=RISK_GROUPS[0])
        group_menu = ttk.Combobox(selector_row, textvariable=self.risk_group_var, values=RISK_GROUPS,
                                   state="readonly", width=20, font=self.font_subtitle)
        group_menu.pack(side="left")
        group_menu.bind("<<ComboboxSelected>>", lambda e: self._render_risk_group_table())

        self.risk_count_label = tk.Label(selector_row, text="", font=self.font_subtitle,
                                          fg=COLOR_TEXT_SECONDARY, bg=COLOR_BG)
        self.risk_count_label.pack(side="left", padx=(14, 0))

        self.risk_scroll = ScrollableArea(container, bg=COLOR_BG)
        self.risk_scroll.pack(fill="both", expand=True, pady=(4, 20))
        self.risk_table_wrap = tk.Frame(self.risk_scroll.body, bg=COLOR_PANEL, highlightthickness=1,
                                         highlightbackground=COLOR_BORDER)
        self.risk_table_wrap.pack(fill="both", expand=True)

        self._render_risk_group_table()

    def _render_risk_group_table(self):
        self.risk_scroll.canvas.yview_moveto(0)
        for w in self.risk_table_wrap.winfo_children():
            w.destroy()

        group_name = self.risk_group_var.get()
        subset = self.store.get_tickers_in_group(group_name)
        self.risk_count_label.config(text=f"{len(subset)} tickers in this group")

        headers = ["Ticker", "Market Cap", "Volume (USD)", "Beta", "Vol 60D", "Risk Score", "Sugg. Leverage"]
        for c, h in enumerate(headers):
            self.risk_table_wrap.grid_columnconfigure(c, weight=1, uniform="rt")
            tk.Label(self.risk_table_wrap, text=h, font=self.font_label, fg=COLOR_ACCENT, bg=COLOR_PANEL,
                     anchor="w").grid(row=0, column=c, sticky="ew", padx=10, pady=(10, 6))

        for r, (_, row) in enumerate(subset.iterrows(), start=1):
            values = [
                row["Ticker"], format_currency(row["Market Cap"]), format_currency(row["Volume in USD"]),
                format_beta(row["Beta"]), format_percent(row["Historical Volatility 60D"]),
                f"{row['Risk Score']:.3f}", f"{row['Suggested Leverage']:.1f}x",
            ]
            for c, v in enumerate(values):
                tk.Label(self.risk_table_wrap, text=v, font=("Segoe UI", 9), fg=COLOR_TEXT_PRIMARY,
                         bg=COLOR_PANEL, anchor="w").grid(row=r, column=c, sticky="ew", padx=10, pady=5)

        order_note = "riskiest-first" if group_name in ("Risky", "Very Risky") else "safest-first"
        footer = tk.Label(self.risk_table_wrap, text=f"Showing all {len(subset)} tickers, {order_note}.",
                           font=("Segoe UI", 8), fg=COLOR_TEXT_SECONDARY, bg=COLOR_PANEL)
        footer.grid(row=len(subset) + 1, column=0, columnspan=len(headers), sticky="w", padx=10, pady=(4, 10))
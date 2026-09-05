const navigation = [
  { label: "Overview", href: "/" },
  { label: "Markets", href: "/markets" },
  { label: "Watchlist", href: "/watchlist" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Research", href: "/research" },
  { label: "Strategies", href: "/strategies" },
];

const secondaryNavigation = [{ label: "Settings", href: "/settings" }];

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <div>
          <div className="text-sm font-semibold tracking-[0.22em] text-foreground">
            TICKERAPP
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted">
            Equity Intelligence
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col px-3 py-5">
        <div className="space-y-1">
          {navigation.map((item, index) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm transition-colors ${
                index === 0
                  ? "bg-accent-muted text-accent"
                  : "text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              <span
                className={`mr-3 h-1.5 w-1.5 rounded-full ${
                  index === 0 ? "bg-accent" : "bg-border"
                }`}
              />
              {item.label}
            </a>
          ))}
        </div>

        <div className="my-5 border-t border-border-subtle" />

        <div className="space-y-1">
          {secondaryNavigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <span className="mr-3 h-1.5 w-1.5 rounded-full bg-border" />
              {item.label}
            </a>
          ))}
        </div>

        <div className="mt-auto rounded-xl border border-border-subtle bg-background/50 p-3">
          <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
            Data Status
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_rgba(53,208,127,0.6)]" />
            <span className="text-xs text-muted-strong">Systems Online</span>
          </div>
        </div>
      </nav>
    </aside>
  );
}
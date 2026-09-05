import { GlobalSearch } from "@/components/command/global-search";

export function Topbar() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <GlobalSearch />
      </div>

      <div className="ml-4 flex shrink-0 items-center gap-4">
        <div className="hidden items-center gap-2 text-xs sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(53,208,127,0.7)]" />
          <span className="text-muted">Markets</span>
          <span className="font-medium text-accent">OPEN</span>
        </div>

        <div className="hidden h-5 w-px bg-border sm:block" />

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-xs text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          aria-label="User profile"
        >
          N
        </button>
      </div>
    </header>
  );
}
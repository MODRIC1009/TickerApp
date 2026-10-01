"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationItem = {
  label: string;
  href: string;
  description: string;
  icon: React.ReactNode;
};

const navigation: NavigationItem[] = [
  {
    label: "Overview",
    href: "/",
    description: "Global market intelligence",
    icon: (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <rect
          x="3"
          y="3"
          width="7"
          height="7"
          rx="1.5"
        />
        <rect
          x="14"
          y="3"
          width="7"
          height="7"
          rx="1.5"
        />
        <rect
          x="3"
          y="14"
          width="7"
          height="7"
          rx="1.5"
        />
        <rect
          x="14"
          y="14"
          width="7"
          height="7"
          rx="1.5"
        />
      </svg>
    ),
  },
  {
    label: "Portfolio",
    href: "/portfolio",
    description: "Holdings and performance",
    icon: (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19V3" />
      </svg>
    ),
  },
  {
    label: "Research",
    href: "/research",
    description: "AI-powered research",
    icon: (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path d="M12 3v4" />
        <path d="M12 17v4" />
        <path d="m4.22 4.22 2.83 2.83" />
        <path d="m16.95 16.95 2.83 2.83" />
        <path d="M3 12h4" />
        <path d="M17 12h4" />
        <path d="m4.22 19.78 2.83-2.83" />
        <path d="m16.95 7.05 2.83-2.83" />
        <circle
          cx="12"
          cy="12"
          r="3"
        />
      </svg>
    ),
  },
];

const intelligenceNavigation: NavigationItem[] = [
  {
    label: "AI Intelligence",
    href: "/research",
    description: "Research assistant",
    icon: (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path d="M12 3v18" />
        <path d="M3 12h18" />
        <path d="m5.6 5.6 12.8 12.8" />
        <path d="m18.4 5.6-12.8 12.8" />
        <circle
          cx="12"
          cy="12"
          r="3"
        />
      </svg>
    ),
  },
  {
    label: "Risk & Portfolio",
    href: "/portfolio",
    description: "Allocation and analytics",
    icon: (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path d="M12 3 20 6v5c0 5.1-3.4 8.8-8 10-4.6-1.2-8-4.9-8-10V6l8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
];

function isActiveRoute(
  pathname: string,
  href: string,
) {
  if (href === "/") {
    return pathname === "/";
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

function NavigationItem({
  item,
  pathname,
}: {
  item: NavigationItem;
  pathname: string;
}) {
  const active = isActiveRoute(
    pathname,
    item.href,
  );

  return (
    <Link
      href={item.href}
      aria-current={
        active ? "page" : undefined
      }
      className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border px-3 py-3 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
        active
          ? "border-accent/20 bg-accent/[0.065] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_10px_28px_rgba(0,0,0,0.14)]"
          : "border-transparent text-muted hover:border-border-subtle hover:bg-surface-hover hover:text-foreground"
      }`}
    >
      {active ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent shadow-[0_0_12px_rgba(53,208,127,0.65)]"
        />
      ) : null}

      <span
        aria-hidden="true"
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 ${
          active
            ? "border-accent/20 bg-accent/10 text-accent"
            : "border-border-subtle bg-background/60 text-muted group-hover:border-border group-hover:text-foreground"
        }`}
      >
        {item.icon}
      </span>

      <span className="min-w-0">
        <span
          className={`block text-sm ${
            active
              ? "font-medium"
              : "font-normal"
          }`}
        >
          {item.label}
        </span>

        <span className="mt-0.5 block truncate text-[10px] leading-4 text-muted">
          {item.description}
        </span>
      </span>

      <span
        aria-hidden="true"
        className={`ml-auto text-xs transition-all duration-200 ${
          active
            ? "translate-x-0 text-accent"
            : "-translate-x-1 text-transparent group-hover:translate-x-0 group-hover:text-muted"
        }`}
      >
        →
      </span>
    </Link>
  );
}

function IntelligenceItem({
  item,
  pathname,
}: {
  item: NavigationItem;
  pathname: string;
}) {
  const active = isActiveRoute(
    pathname,
    item.href,
  );

  const isAi = item.label === "AI Intelligence";

  return (
    <Link
      href={item.href}
      aria-current={
        active ? "page" : undefined
      }
      className={`group relative flex items-center gap-3 rounded-xl border px-3 py-3 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
        active
          ? "border-border-subtle bg-background/70 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]"
          : "border-transparent text-muted hover:border-border-subtle hover:bg-surface-hover hover:text-foreground"
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
          isAi
            ? "border-info/20 bg-info/[0.08] text-info"
            : "border-accent/20 bg-accent/[0.08] text-accent"
        }`}
      >
        {item.icon}
      </span>

      <span className="min-w-0">
        <span className="block text-sm">
          {item.label}
        </span>

        <span className="mt-0.5 block truncate text-[10px] leading-4 text-muted">
          {item.description}
        </span>
      </span>

      {active ? (
        <span
          aria-hidden="true"
          className="ml-auto h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(53,208,127,0.5)]"
        />
      ) : null}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-[272px] shrink-0 flex-col border-r border-border bg-surface/80 shadow-[18px_0_60px_rgba(0,0,0,0.08)] backdrop-blur-2xl lg:flex">
      <div className="flex h-[72px] shrink-0 items-center border-b border-border px-5">
        <Link
          href="/"
          className="group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          aria-label="TickerApp home"
        >
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-accent/20 bg-accent/[0.08] shadow-[0_0_24px_rgba(53,208,127,0.06)]"
            >
              <span className="absolute h-4 w-4 rounded-full bg-accent/20 blur-md" />

              <span className="relative font-mono text-xs font-bold text-accent">
                T
              </span>
            </span>

            <span>
              <span className="block text-sm font-semibold tracking-[0.2em] text-foreground">
                TICKERAPP
              </span>

              <span className="mt-0.5 block text-[8px] uppercase tracking-[0.18em] text-muted">
                Equity Intelligence
              </span>
            </span>
          </div>
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 py-5">
        <div className="mb-2 flex items-center justify-between px-3">
          <span className="text-[9px] font-semibold uppercase tracking-[0.17em] text-muted">
            Workspace
          </span>

          <span className="font-mono text-[8px] text-muted">
            01
          </span>
        </div>

        <nav
          aria-label="Primary navigation"
          className="space-y-1"
        >
          {navigation.map((item) => (
            <NavigationItem
              key={item.href}
              item={item}
              pathname={pathname}
            />
          ))}
        </nav>

        <div className="my-6 border-t border-border-subtle" />

        <div className="mb-2 flex items-center justify-between px-3">
          <span className="text-[9px] font-semibold uppercase tracking-[0.17em] text-muted">
            Intelligence
          </span>

          <span className="font-mono text-[8px] text-muted">
            02
          </span>
        </div>

        <div className="space-y-1">
          {intelligenceNavigation.map(
            (item) => (
              <IntelligenceItem
                key={`${item.label}-${item.href}`}
                item={item}
                pathname={pathname}
              />
            ),
          )}
        </div>

        <div className="mt-auto pt-6">
          <div className="relative overflow-hidden rounded-2xl border border-border-subtle bg-background/50 p-4 shadow-[0_16px_45px_rgba(0,0,0,0.16)]">
            <div
              aria-hidden="true"
              className="absolute -right-10 -top-12 h-24 w-24 rounded-full bg-accent/[0.065] blur-2xl"
            />

            <div
              aria-hidden="true"
              className="absolute bottom-0 left-0 h-16 w-20 rounded-full bg-info/[0.025] blur-2xl"
            />

            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted">
                  System
                </span>

                <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-accent">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(53,208,127,0.6)]"
                    aria-hidden="true"
                  />
                  Operational
                </span>
              </div>

              <p className="mt-3 font-mono text-[10px] text-foreground">
                MARKET INTELLIGENCE
              </p>

              <p className="mt-1.5 text-[10px] leading-5 text-muted">
                Market data, quantitative risk,
                research, portfolio analytics,
                and strategy intelligence.
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3">
                <span className="text-[8px] uppercase tracking-[0.12em] text-muted">
                  Data layer
                </span>

                <span className="font-mono text-[9px] text-muted-strong">
                  LIVE / CALCULATED
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
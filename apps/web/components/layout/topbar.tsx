"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { GlobalSearch } from "@/components/command/global-search";

type HealthResponse = {
  status?: string;
  healthy?: boolean;
  provider?: string;
  providerName?: string;
};

type StatusTone =
  | "healthy"
  | "degraded"
  | "checking";

function getStatusLabel(
  health: HealthResponse | null,
): string {
  if (!health) {
    return "Checking";
  }

  if (
    health.healthy === false ||
    health.status === "unhealthy" ||
    health.status === "unavailable" ||
    health.status === "degraded"
  ) {
    return "Degraded";
  }

  return "Operational";
}

function getStatusTone(
  health: HealthResponse | null,
): StatusTone {
  if (!health) {
    return "checking";
  }

  if (
    health.healthy === false ||
    health.status === "unhealthy" ||
    health.status === "unavailable" ||
    health.status === "degraded"
  ) {
    return "degraded";
  }

  return "healthy";
}

function getStatusClasses(
  tone: StatusTone,
): {
  text: string;
  dot: string;
  ring: string;
} {
  if (tone === "healthy") {
    return {
      text: "text-accent",
      dot: "bg-accent shadow-[0_0_10px_rgba(53,208,127,0.65)]",
      ring: "bg-accent/50",
    };
  }

  if (tone === "degraded") {
    return {
      text: "text-warning",
      dot: "bg-warning shadow-[0_0_9px_rgba(245,185,66,0.45)]",
      ring: "bg-warning/40",
    };
  }

  return {
    text: "text-muted",
    dot: "bg-muted",
    ring: "bg-muted/30",
  };
}

export function Topbar() {
  const [health, setHealth] =
    useState<HealthResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      try {
        const response = await fetch(
          "/api/market-data/status",
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          if (!cancelled) {
            setHealth({
              healthy: false,
              status: "unhealthy",
            });
          }

          return;
        }

        const payload =
          (await response.json()) as HealthResponse;

        if (!cancelled) {
          setHealth(payload);
        }
      } catch {
        if (!cancelled) {
          setHealth({
            healthy: false,
            status: "unhealthy",
          });
        }
      }
    }

    void loadHealth();

    const interval =
      window.setInterval(
        loadHealth,
        60_000,
      );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const statusLabel =
    getStatusLabel(health);

  const statusTone =
    getStatusTone(health);

  const statusClasses =
    getStatusClasses(statusTone);

  const providerLabel =
    health?.providerName ??
    health?.provider ??
    "Market data";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 shadow-[0_8px_30px_rgba(0,0,0,0.14)] backdrop-blur-2xl">
      <div className="flex min-h-[72px] items-center gap-3 px-4 md:px-6 lg:px-8">
        <div className="min-w-0 flex-1 md:max-w-3xl">
          <GlobalSearch />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-3 rounded-xl border border-border-subtle bg-surface/55 px-3 py-2 sm:flex">
            <span
              className="relative flex h-2 w-2 shrink-0"
              aria-hidden="true"
            >
              {statusTone !== "checking" ? (
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full ${statusClasses.ring}`}
                />
              ) : null}

              <span
                className={`relative h-2 w-2 rounded-full ${statusClasses.dot}`}
              />
            </span>

            <div className="hidden lg:block">
              <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-muted">
                Data layer
              </p>

              <p
                className={`mt-0.5 text-[9px] font-medium uppercase tracking-[0.08em] ${statusClasses.text}`}
              >
                {statusLabel}
              </p>
            </div>
          </div>

          <div className="hidden h-8 w-px bg-border sm:block" />

          <Link
            href="/research"
            className="group hidden items-center gap-2 rounded-xl border border-border bg-surface/45 px-3 py-2.5 text-xs font-medium text-muted transition-all duration-200 hover:border-info/30 hover:bg-info/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 md:inline-flex"
          >
            <span
              aria-hidden="true"
              className="flex h-5 w-5 items-center justify-center rounded-md border border-info/15 bg-info/[0.06] text-[10px] text-info transition-transform duration-200 group-hover:scale-105"
            >
              ✦
            </span>

            AI Research
          </Link>

          <Link
            href="/portfolio"
            className="group inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 text-xs font-medium text-foreground shadow-[0_6px_20px_rgba(0,0,0,0.1)] transition-all duration-200 hover:border-accent/30 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <span
              aria-hidden="true"
              className="flex h-5 w-5 items-center justify-center rounded-md border border-accent/15 bg-accent/[0.06] text-[10px] text-accent transition-transform duration-200 group-hover:scale-105"
            >
              ◈
            </span>

            <span className="hidden xs:inline">
              Portfolio
            </span>
          </Link>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-60"
      />

      <div className="hidden h-7 items-center justify-between px-6 text-[8px] uppercase tracking-[0.13em] text-muted lg:flex">
        <div className="flex items-center gap-5">
          <span>
            Global Equity Intelligence
          </span>

          <span className="text-border">
            /
          </span>

          <span>
            Real-time when provider-supported
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-muted">
            Provider
          </span>

          <span className="font-mono tracking-[0.08em] text-muted-strong">
            {providerLabel}
          </span>
        </div>
      </div>
    </header>
  );
}
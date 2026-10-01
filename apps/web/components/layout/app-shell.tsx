"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

interface AppShellProps {
  children: ReactNode;
}

const mobileNavigation = [
  {
    label: "Overview",
    href: "/",
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
    icon: (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <circle
          cx="11"
          cy="11"
          r="7"
        />
        <path d="m20 20-4-4" />
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

export function AppShell({
  children,
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(53,208,127,0.08),transparent_38%)]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_25%,rgba(92,168,255,0.025),transparent_28%)]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,255,255,0.012)_100%)]" />

        <div className="absolute left-1/2 top-0 h-[560px] w-[1000px] -translate-x-1/2 rounded-full bg-accent/[0.025] blur-3xl" />

        <div
          className="absolute inset-x-0 bottom-0 h-[52vh] opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage:
              "linear-gradient(to top, black, transparent)",
            WebkitMaskImage:
              "linear-gradient(to top, black, transparent)",
          }}
        />

        <div
          className="absolute inset-x-0 bottom-0 h-[30vh] opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at center bottom, rgba(53,208,127,0.055), transparent 65%)",
          }}
        />
      </div>

      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />

          <main className="relative min-w-0 flex-1 overflow-auto pb-24 lg:pb-0">
            <div className="relative">
              {children}
            </div>
          </main>

          <nav
            aria-label="Mobile navigation"
            className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-16px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl lg:hidden"
          >
            <div className="mx-auto flex h-16 max-w-lg items-center justify-around gap-1">
              {mobileNavigation.map(
                (item) => {
                  const active =
                    isActiveRoute(
                      pathname,
                      item.href,
                    );

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={
                        active
                          ? "page"
                          : undefined
                      }
                      className={`relative flex min-w-20 flex-1 flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                        active
                          ? "bg-surface text-foreground shadow-[0_8px_28px_rgba(0,0,0,0.2)]"
                          : "text-muted hover:bg-surface-hover hover:text-foreground"
                      }`}
                    >
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="absolute left-1/2 top-0 h-px w-8 -translate-x-1/2 bg-accent shadow-[0_0_8px_rgba(53,208,127,0.55)]"
                        />
                      ) : null}

                      <span
                        className={
                          active
                            ? "text-accent"
                            : "text-muted"
                        }
                      >
                        {item.icon}
                      </span>

                      {item.label}
                    </Link>
                  );
                },
              )}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
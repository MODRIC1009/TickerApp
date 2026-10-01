import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  description?: string;
  icon?: ReactNode;
};

export function MetricCard({
  label,
  value,
  change,
  changeType = "neutral",
  description,
  icon,
}: MetricCardProps) {
  const changeClass =
    changeType === "positive"
      ? "text-accent"
      : changeType === "negative"
        ? "text-negative"
        : "text-muted";

  const changeDotClass =
    changeType === "positive"
      ? "bg-accent shadow-[0_0_8px_rgba(53,208,127,0.45)]"
      : changeType === "negative"
        ? "bg-negative shadow-[0_0_8px_rgba(239,68,68,0.4)]"
        : "bg-muted";

  return (
    <article className="group relative isolate overflow-hidden rounded-2xl border border-border bg-surface/80 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.1)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-border-strong hover:bg-surface-hover hover:shadow-[0_20px_50px_rgba(0,0,0,0.16)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full bg-accent/[0.04] blur-3xl transition-all duration-500 group-hover:scale-125 group-hover:bg-accent/[0.065]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-5 top-0 h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-accent/50 to-transparent transition-transform duration-500 group-hover:scale-x-100"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-5 bottom-0 h-px origin-left scale-x-0 bg-accent/40 transition-transform duration-300 group-hover:scale-x-100"
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-muted transition-colors duration-300 group-hover:bg-accent" />

            <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-muted">
              {label}
            </p>
          </div>

          <div className="mt-3 flex min-w-0 items-end gap-2">
            <p className="min-w-0 truncate font-mono text-[1.65rem] font-semibold leading-none tracking-tight text-foreground">
              {value}
            </p>

            {change ? (
              <span
                className={`mb-0.5 flex items-center gap-1.5 whitespace-nowrap font-mono text-[10px] font-medium ${changeClass}`}
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full ${changeDotClass}`}
                />

                {change}
              </span>
            ) : null}
          </div>
        </div>

        {icon ? (
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-background/55 text-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] transition-all duration-300 group-hover:border-accent/20 group-hover:bg-accent/[0.05] group-hover:text-accent">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-xl bg-accent/[0.025] opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100"
            />

            <span className="relative">
              {icon}
            </span>
          </div>
        ) : null}
      </div>

      {description ? (
        <div className="relative mt-4 border-t border-border-subtle pt-3">
          <p className="text-[10px] leading-4 text-muted">
            {description}
          </p>
        </div>
      ) : null}
    </article>
  );
}
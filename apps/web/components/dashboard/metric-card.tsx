interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  description?: string;
}

export function MetricCard({
  label,
  value,
  change,
  changeType = "neutral",
  description,
}: MetricCardProps) {
  const changeClassName = {
    positive: "text-accent",
    negative: "text-negative",
    neutral: "text-muted",
  }[changeType];

  return (
    <section className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-muted">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            {label}
          </p>

          <p className="mt-3 truncate text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
        </div>

        {change && (
          <span
            className={`shrink-0 rounded-md bg-background px-2 py-1 font-mono text-xs ${changeClassName}`}
          >
            {change}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-3 text-xs leading-5 text-muted">{description}</p>
      )}
    </section>
  );
}
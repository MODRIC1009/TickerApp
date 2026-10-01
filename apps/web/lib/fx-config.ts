export interface FxConfig {
  providerId: string;
  fallbackProviderIds: string[];
}

function parseProviderIds(
  value: string | undefined,
): string[] {
  return (value ?? "")
    .split(",")
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);
}

export function getFxConfig(): FxConfig {
  const providerId =
    process.env.FX_PROVIDER?.trim().toLowerCase() ??
    "demo-fx";

  return {
    providerId: providerId || "demo-fx",
    fallbackProviderIds: parseProviderIds(
      process.env.FX_FALLBACK_PROVIDERS,
    ),
  };
}
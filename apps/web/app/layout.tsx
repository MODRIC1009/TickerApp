import type { Metadata, Viewport } from "next";

import "./globals.css";

import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: {
    default: "TickerApp — Global Equity Intelligence",
    template: "%s — TickerApp",
  },
  description:
    "Global equity intelligence, live market data, quantitative risk analytics, portfolio intelligence, and AI-powered research.",
  applicationName: "TickerApp",
  keywords: [
    "equity intelligence",
    "stock analytics",
    "market intelligence",
    "quantitative risk",
    "portfolio analytics",
    "AI research",
    "global markets",
  ],
  authors: [
    {
      name: "TickerApp",
    },
  ],
  creator: "TickerApp",
  publisher: "TickerApp",
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#07090d",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
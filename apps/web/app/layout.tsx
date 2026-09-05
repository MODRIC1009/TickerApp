import type { Metadata } from "next";

import "./globals.css";

import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "TickerApp — Equity Intelligence",
  description:
    "Global equity intelligence, quantitative analytics, portfolio research, and AI-powered market analysis.",
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
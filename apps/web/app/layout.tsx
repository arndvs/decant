import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Decant — Portfolio Tracker",
    template: "%s · Decant",
  },
  description:
    "Local-first portfolio tracking. Lot-level accounting, realized gains, dividends, and an inherited-IRA decant view.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
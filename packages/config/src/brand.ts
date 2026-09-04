/**
 * Decant brand constants — single source of truth.
 * (Pattern lifted from Launch's `packages/config/src/brand.ts`.)
 */
export const brand = {
  name: "Decant",
  tagline: "The ledger, the line, and the plan.",
  /** npm package scope */
  scope: "@decant",
  /** default page title suffix */
  titleSuffix: "· Decant",
} as const;

/** Default portfolio accounts. */
export const ACCOUNTS = ["AccountA", "AccountB", "AccountC"] as const;

/** Category set (from the tracker's Mom-specific taxonomy). */
export const CATEGORIES = [
  "Uranium & Nuclear",
  "Oil & Gas Producers",
  "Oilfield Services",
  "Precious Metals",
  "Base Metals",
  "Lithium & Rare Earths",
  "Energy Infrastructure",
  "Dividend Income ETFs",
  "Other",
] as const;

/**
 * Whole-portfolio target allocation (the rebalance direction).
 * Sums to 100%. Edit here to change the strategy.
 */
export const TARGET_ALLOCATION = {
  "Uranium & Nuclear": 0.2,
  "Oil & Gas Producers": 0.15,
  "Oilfield Services": 0.05,
  "Precious Metals": 0.15,
  "Base Metals": 0.12,
  "Lithium & Rare Earths": 0.05,
  "Energy Infrastructure": 0.03,
  "Dividend Income ETFs": 0.2,
  Other: 0.05,
} as const satisfies Record<(typeof CATEGORIES)[number], number>;

/** The inherited-IRA exit deadline. */
export const IRA_DEADLINE = "2031-12-31";

/** Initial cash buffer: 2 years of estimated tax bills. */
export const CASH_BUFFER_INITIAL = 11500;

/** Commission/fee-free OTC tickers that need manual price entry (yfinance may not quote). */
export const MANUAL_PRICE_TICKERS = [
  "AAAS", "AAAE", "AAAR", "AAAF", "AABE", "AABB", "AABC", "AABD", "AAAA", "AABF",
] as const;
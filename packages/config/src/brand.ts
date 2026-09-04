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

/** Income-sleeve tickers — the dividend-income growth destination (20% target).
 *  From the portfolio direction plan D2/D8 + v3 Slice 3. JEPI/JEPQ are candidates. */
export const INCOME_SLEEVE_TICKERS = [
  "AAAH", "AAAI", "AAAJ", "AAAK", "AAAM", "AAAL", "AAAN", "AAAO",
] as const;

/** Optional income-sleeve candidates (not yet in the sleeve). */
export const INCOME_SLEEVE_CANDIDATES = ["JEPI", "JEPQ"] as const;

/** Household-wide position cap — no single position may exceed this % of the portfolio. */
export const POSITION_CAP = 0.08;

/** Inherited-IRA tranche sizing — ~20% of over-cap positions distributed per year. */
export const IRA_TRANCHE = 0.2;

/** The 40/15/15/15/15 income-sleeve internal split (AAAL/AAAM/AAAK/AAAN/AAAO). */
export const INCOME_SLEEVE_SPLIT = {
  AAAL: 0.4,
  AAAM: 0.15,
  AAAK: 0.15,
  AAAN: 0.15,
  AAAO: 0.15,
} as const;

/**
 * Cash-buffer trajectory — 2 years of estimated tax bills, declining to ~0 by
 * 2030 (never let a distribution force a sale to pay its own tax).
 * Initial = CASH_BUFFER_INITIAL; the trajectory is a linear drawdown.
 */
export const CASH_BUFFER_TRAJECTORY = {
  initial: CASH_BUFFER_INITIAL,
  /** year the buffer reaches 0 */
  exhaustedBy: 2030,
} as const;

/**
 * The complete rebalance strategy — every number the engines + UI need,
 * assembled from the direction plan's D2/D4/D7/D8 decisions.
 */
export const REBALANCE_STRATEGY = {
  /** Whole-portfolio target allocation (the income sleeve = Dividend Income ETFs). */
  targets: TARGET_ALLOCATION,
  /** The max a single position may reach. */
  positionCap: POSITION_CAP,
  /** The income-sleeve parts (subset of CATEGORIES that IS the sleeve). */
  incomeSleeveCategories: ["Dividend Income ETFs", "Energy Infrastructure"] as const,
  /** The active income-sleeve tickers. */
  incomeSleeveTickers: INCOME_SLEEVE_TICKERS,
  /** Yearly distribution tranche for the inherited IRA. */
  iraTranche: IRA_TRANCHE,
  /** The IRA deadline (2031) — the free-trading window closes here. */
  iraDeadline: IRA_DEADLINE,
  cashBufferTrajectory: CASH_BUFFER_TRAJECTORY,
} as const;
/**
 * Schwab bridge — the mapping + taxonomy knowledge that exists ONLY in the
 * replay scripts (trade-log-replay2.py) and would be lost in a naive port.
 *
 * Source of truth: `~/cmd-private/working/tmp/trade-log-replay2.py` (the APPLIED
 * replay — the only round that reconciles 74/74). Do NOT use replay-analysis.py
 * or trade-log-replay.py (v1): they carry two-hop chains and missing maps.
 *
 * These are the credentials of the ingestor: when Decant reads Schwab
 * /transactions, this module decides how each raw symbol resolves to the
 * ticker in today's positions.
 */

/** Schwab → canonical account-name map (from XML/CSV filenames). */
export const ACCOUNT_MAP = {
  "AccountA": "AccountA",
  "Designated_Bene_Individual": "AccountB",
  "AccountC_from_IRA": "AccountC",
} as const;

/** Raw symbol → current ticker, per account. Applied round only. */
export const DRIFT = {
  AccountA: {
    AABG: "AAAB",
    AABH: "AAAT",
    "111111111": "AAAT",
    AABI: "AAAQ",
    AABJ: "AAAS",
    AABK: "AAAU",
    AAAU: "AAAU",
    AABO: "AAAW",
    AABL: "AAAV",
    AABM: "AAAA",
    AABN: "AAAA",
    "222222222": "AAAA",
    "333333333": "AAAC",
    "333333334": "AAAC",
    "444444444": "AAAR",
    AABP: "AAAR",
    "555555555": "AAAB",
    "666666666": "AAAT",
    "777777777": "AABO",
    "888888888": "AAAQ",
    "999999999": "AAAP",
    "101010101": "AAAD",
    "202020202": "AAZ",
    "303030303": "AABA",
    505050505: "AAAP",
    "404040404": "AAAP",
  },
  AccountB: {
    AABG: "AAAB",
    "555555555": "AAAB",
    AAX: "AAX",
    AAY: "AAY",
  },
  "AccountC": {
    AABG: "AAAB",
    AABH: "AAAT",
    "111111111": "AAAT",
    AABI: "AAAQ",
    AABJ: "AAAS",
    AABK: "AAAU",
    AAAU: "AAAU",
    HLX: "AABB",
    AABO: "AAAW",
    AABL: "AAAV",
    AABM: "AAAA",
    AABN: "AAAA",
    "222222222": "AAAA",
    "333333333": "AAAC",
    "333333334": "AAAC",
    "444444444": "AAAR",
    AABP: "AAAR",
    "555555555": "AAAB",
    "666666666": "AAAT",
    "777777777": "AABO",
    "888888888": "AAAQ",
    "999999999": "AAAP",
    "101010101": "AAAD",
    "202020202": "AAZ",
    "303030303": "AABA",
    505050505: "AAAP",
    "404040404": "AAAP",
  },
} as const;

/** CUSIP → ticker (applied round). A symbol that's all digits maps here. */
export const CUSIP_MAP = {
  "666666666": "AAAT",
  "777777777": "AABO",
  "888888888": "AAAQ",
  "999999999": "AAAP",
  "101010101": "AAAD",
  "202020202": "AAZ",
  "303030303": "AABA",
  "555555555": "AAAB",
  "444444444": "AAAR",
  "222222222": "AAAA",
  "333333333": "AAAC",
  "111111111": "AAAT",
  505050505: "AAAP",
  "404040404": "AAAP",
} as const;

/** A fully-numeric symbol is a CUSIP (resolved via CUSIP_MAP). */
export const CUSIP_RE = /^\d{6,9}$/;

/** The 3 accounts' XML + CSV file naming pattern (timestamped Schwab exports). */
export const SCHWAB_SOURCES = [
  {
    account: "AccountA",
    xml: "AccountA_ZZZ001_Transactions_20200101-190155.xml",
    csv: "AccountA-Positions-2020-01-01-170551.csv",
  },
  {
    account: "AccountB",
    xml: "Designated_Bene_Individual_ZZZ002_Transactions_20200101-190148.xml",
    csv: "Designated Bene Individual-Positions-2020-01-01-170508.csv",
  },
  {
    account: "AccountC",
    xml: "AccountC_from_IRA_ZZZ003_Transactions_20200101-190202.xml",
    csv: "AccountC from IRA-Positions-2020-01-01-170611.csv",
  },
] as const;

/** Schwab XML `Action` taxonomy → Decant handling. */
export const ACTION_TAXONOMY = {
  /** Dividend-like → dividend rows (sum to dividends). */
  DIV_ACTIONS: [
    "Qualified Dividend",
    "Cash Dividend",
    "Non-Qualified Div",
    "Special Dividend",
    "Special Qual Div",
    "Pr Yr Cash Div",
    "Qualified Div Adj",
    "Return Of Capital",
    "Return Of Cap Adj",
    "Bond Interest",
    "Bank Interest",
    "Reinvest Dividend",
  ] as const,
  /** Fee-like → ignored (not dividends). */
  FEE_ACTIONS: ["ADR Mgmt Fee", "Foreign Tax Paid", "Foreign Tax Reclaim"] as const,
  /** Cash-like → Internal Transfer opens a Buy; others skipped. */
  CASH_ACTIONS: [
    "Internal Transfer",
    "Cash In Lieu",
    "Cash Merger",
    "Final Cash Liquid",
    "Cash Merger Adj",
    "Final Cash Liquid Adj",
    "Interest Adj",
  ] as const,
  /** Journaled/Other → skipped. */
  SKIP_ACTIONS: ["Journaled Shares", "Other"] as const,
  /** Split/merger → Buy/Sell pair (E only counts Buy/Sell), never "Split" row. */
  SPLIT_ACTIONS: ["Reverse Split", "Stock Merger", "Cash/Stock Merger", "Stock Split"] as const,
  /** Name Change → no-op. */
  NAME_CHANGE_ACTIONS: ["Name Change"] as const,
  /** Rights → Buy. */
  RIGHTS_ACTIONS: ["Dist Rights Trans"] as const,
  /** Reinvest → dividend row. */
  REINVEST_ACTIONS: ["Qual Div Reinvest"] as const,
} as const;

/** Transfer-in date — the portfolio's opening position (2023-05-30). */
export const TRANSFER_DATE = "2023-05-30";

/**
 * The 10 commission/fee-free OTC tickers Google Finance (and yfinance) may not
 * quote — manual price entry required. (AABC/AABB are separately quote-less by
 * design; the audit flags them as unquoted-not-bug.)
 */
export const UNQUOTED = [
  "AAAS",
  "AAAE",
  "AAAR",
  "AAAF",
  "AABE",
  "AABB",
  "AABC",
  "AABD",
  "AAAA",
  "AABF",
] as const;

/**
 * The known-gap whitelist for replay reconciliation: 185 AABC rights shares
 * ($0) have no XML record — cosmetic, value $0.
 */
export const REPLAY_KNOWN_GAPS = ["AABC"] as const;

/** The replay's reconcile gate: pre-transfer Buy/Sell history is out of model. */
export const isPreTransfer = (isoDate: string) =>
  isoDate < TRANSFER_DATE;

/** Resolve a raw Schwab symbol → current ticker for a given account. */
export function resolveTicker(symbol: string, account: string): string {
  const acct = ACCOUNT_MAP[account as keyof typeof ACCOUNT_MAP] ?? account;
  const drift = DRIFT[acct as keyof typeof DRIFT] ?? {};
  const mapped = (drift as Record<string, string>)[symbol] ?? symbol;
  if (CUSIP_RE.test(mapped)) {
    return (CUSIP_MAP as Record<string, string>)[mapped] ?? mapped;
  }
  return mapped;
}
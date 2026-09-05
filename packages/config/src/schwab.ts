/**
 * Schwab bridge — the mapping + taxonomy that turns a Schwab transaction
 * export into Decant's canonical form.
 *
 * The bridge is deliberately SHAPE-ONLY in this public repo: the specific
 * account names, export filenames, and symbol↔ticker drift mappings belong
 * to whoever runs Decant (their broker, their holdings). An operator
 * populates these at runtime or from a private config file.
 *
 * The ACTION_TAXONOMY here is the COMPLETE Schwab XML action set — that's
 * shared, public knowledge about the Schwab export format itself and is
 * safe to ship.
 */

/** Schwab → canonical account-name map. SHAPE only — populate per operator. */
export const ACCOUNT_MAP = {
  "<account_xml_prefix>": "<canonical_account_name>",
} as const;

/**
 * Raw symbol → current ticker, per account. The bridge an operator builds
 * from THEIR Schwab export (a ticker that changed on a merger, or a raw
 * CUSIP, resolves to today's symbol). SHAPE only.
 */
export const DRIFT = {
  "<account>": {
    "<old_symbol>": "<current_ticker>",
  },
} as const;

/** CUSIP → ticker. A symbol that's all digits maps here. Sample shape only. */
export const CUSIP_MAP = {
  "<9_digit_cusip>": "<current_ticker>",
} as const;

/** A fully-numeric symbol is a CUSIP (resolved via CUSIP_MAP). */
export const CUSIP_RE = /^\d{6,9}$/;

/** The accounts' XML + CSV file naming pattern (timestamped Schwab exports). */
export const SCHWAB_SOURCES = [
  {
    account: "<account_1>",
    xml: "<account>_Transactions_<timestamp>.xml",
    csv: "<account>-Positions-<date>.csv",
  },
  {
    account: "<account_2>",
    xml: "<account>_Transactions_<timestamp>.xml",
    csv: "<account>-Positions-<date>.csv",
  },
  {
    account: "<account_3>",
    xml: "<account>_Transactions_<timestamp>.xml",
    csv: "<account>-Positions-<date>.csv",
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

/**
 * The opening-position cutoff. Transactions BEFORE the transfer-in date are
 * out of model (the portfolio began with an in-kind/transfer opening).
 * SENTINEL — replace with the date the operator's own portfolio opened.
 */
export const TRANSFER_DATE = "1999-12-31";

/**
 * Manual-price set — an operator lists the tickers their quote source
 * doesn't price, so Decant knows to fetch/enter them manually. SHAPE only.
 */
export const UNQUOTED = ["<unquoted_ticker>"] as const;

/**
 * Known-gap whitelist for replay reconciliation — symbols whose recorded
 * shares ($0) have no broker transaction record. SHAPE only.
 */
export const REPLAY_KNOWN_GAPS = ["<known_gap_symbol>"] as const;

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

/**
 * Realized-gains engine — ports the sheet's STRICT X formula to lot-level.
 *
 * Sheet (Calc TL col X, applied 2020-01-02):
 *   X = if(B≠"", if(OR($C$2270=I, "*"), if(AND(C="Sell", U>0, AP>0),
 *       IFERROR(W − AP×AG, 0), 0), 0), "")
 *
 * Ported meaning:
 *   U>0  → the row is a REAL sale (proceeds > 0) — excludes conversion legs
 *          (merger/reverse-split sell-legs carry $0 proceeds BY DESIGN).
 *   AP>0 → the lot has a KNOWN cost basis (ACB/share) — excludes rows whose
 *          ACB is 0/unknown (sold-out symbols, missing basis).
 *
 * CRITICAL: the gate is NOT "is this a conversion leg" (a flag). It is
 * "sale with proceeds AND known basis". The conversion-leg explanation is
 * only the REASON most W=0 sells exist. Using a flag would re-introduce
 * the class of bug: a genuinely-sold position could be flagged as a leg.
 */
export type AccountName = "AccountA" | "AccountB" | "AccountC";

/** A sale-row's inputs — mirrors one Calc TL sell row after FX. */
export interface SaleRow {
  symbol: string;
  account: string;
  /** U: sale proceeds (net of fees), common currency (the W column input). */
  proceeds: number;
  /** AP: cost basis per share (ACB/share). 0/unknown → excluded (AP>0 gate). */
  basisPerShare: number;
  /** AG: split-adjusted quantity (the shares whose basis is realized). */
  quantity: number;
  /** Whether the lot's basis is estimated (from the sheet's ACB — never harvest). */
  basisEstimated?: boolean;
}

/** A realized-gain result per sale row. */
export interface RealizedRow {
  symbol: string;
  account: string;
  /** Per-sale realized gain (proceeds − basis). 0 for excluded rows. */
  gain: number;
  /** True if the gate passed (U>0 AND AP>0). */
  counted: boolean;
  /** Reason for exclusion, when not counted. */
  excluded?: "no_proceeds" | "unknown_basis" | "not_sale";
}

/**
 * Realized gain for ONE sale row — the STRICT X formula inline.
 * Mirrors the sheet: `if(AND(C="Sell", U>0, AP>0), W − AP×AG, 0)`.
 *
 * The sheet stores X as a per-row cell; SUMIFS sums the rounded display
 * cents. To reproduce the oracle ($150.00 / $150.00) exactly, round each
 * row's gain to cents BEFORE totalling (the sheet's row precision).
 */
export function realizedForSale(row: SaleRow): RealizedRow {
  if (row.proceeds <= 0) {
    return { symbol: row.symbol, account: row.account, gain: 0, counted: false, excluded: "no_proceeds" };
  }
  if (row.basisPerShare <= 0) {
    return { symbol: row.symbol, account: row.account, gain: 0, counted: false, excluded: "unknown_basis" };
  }
  const raw = row.proceeds - row.basisPerShare * row.quantity;
  const gain = Math.round(raw * 100) / 100;
  return { symbol: row.symbol, account: row.account, gain, counted: true };
}

/** Realized gain over ALL sale rows, totalled by account. */
export function realizedByAccount(
  rows: SaleRow[],
): { rows: RealizedRow[]; byAccount: Record<string, number>; total: number } {
  const results = rows.map(realizedForSale);
  const byAccount: Record<string, number> = {};
  let total = 0;
  for (const r of results) {
    if (!r.counted) continue;
    // Watch: the sheet DOES count a 0-basis (AP=0) sale in the FIXED variant —
    // but STRICT excludes it. The engine's default is STRICT.
    byAccount[r.account] = (byAccount[r.account] ?? 0) + r.gain;
    total += r.gain;
  }
  return { rows: results, byAccount, total };
}
/**
 * Dividends engine — sums dividend income from transaction rows.
 *
 * Sheet: Dividends tab = SUMIFS over Calc TL col AK (`Amount` for rows
 * with `C="Dividend"`), filtered to current holdings. The portfolio's
 * verified dividends total (with per-year split) is the reconciliation
 * fixture for this engine.
 *
 * Port: iterate the append-only transactions table, take rows tagged
 * Dividend-like (the ACTION_TAXONOMY.DIV_ACTIONS from config), sum amount.
 * No AK column needed — it's derivable from typed rows.
 */
export interface DividendRow {
  date: string; // ISO YYYY-MM-DD
  account: string;
  symbol: string;
  amount: number;
}

export interface DividendsResult {
  total: number;
  byYear: Record<string, number>;
  byAccount: Record<string, number>;
  count: number;
}

export function dividendsAnnual(rows: DividendRow[]): DividendsResult {
  let total = 0;
  const byYear: Record<string, number> = {};
  const byAccount: Record<string, number> = {};

  for (const d of rows) {
    if (d.amount <= 0) continue;
    total += d.amount;
    const year = d.date.slice(0, 4);
    byYear[year] = (byYear[year] ?? 0) + d.amount;
    byAccount[d.account] = (byAccount[d.account] ?? 0) + d.amount;
  }

  return { total, byYear, byAccount, count: rows.length };
}
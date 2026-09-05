/**
 * ACB engine — adjusted cost base as a DERIVED view over open lots.
 *
 * Sheet: ACB is the Calc TL running window (P/Q/R → R = ACB Post-Trx), and
 * `ACB/share = R/O` (per (sym,acct)). The sheet's verified ACB total (across
 * open positions) is the reconciliation fixture for this derived view.
 *
 * Design (schema.md): lots are the source of truth; ACB is NEVER stored —
 * it's computed as weighted-avg of open-lot basis. This keeps the sheet's
 * ACB as a reconciliation fixture, then the view replaces it once trusted.
 *
 * The weighted-avg formula (schema.md + the sheet's ACB-per-share):
 *   acb_per_share = Σ(cost_basis_per_share × open_quantity) / Σ(open_quantity)
 *   acb_total     = Σ(cost_basis_per_share × open_quantity)
 */
export interface Lot {
  symbol: string;
  account: string;
  /** Original acquired quantity (pre-splits). */
  quantity: number;
  /** Remaining (open) quantity — open_quantity > 0 means open. */
  openQuantity: number;
  /** Cost basis per share at acquisition (in USD). */
  costBasisPerShare: number;
  /** True when basis came from the sheet's ACB and cannot be reversed into lots. */
  basisEstimated?: boolean;
}

export interface AcbPosition {
  symbol: string;
  account: string;
  openQuantity: number;
  acbTotal: number;
  acbPerShare: number;
}

/** ACB per position = weighted avg of open lot basis. */
export function acbForPosition(lots: Lot[]): AcbPosition | null {
  const open = lots.filter((l) => l.openQuantity > 0);
  if (open.length === 0) return null;
  const acbTotal = open.reduce(
    (s, l) => s + l.costBasisPerShare * l.openQuantity,
    0,
  );
  const openQuantity = open.reduce((s, l) => s + l.openQuantity, 0);
  if (openQuantity <= 0) return null;
  return {
    symbol: open[0].symbol,
    account: open[0].account,
    openQuantity,
    acbTotal,
    acbPerShare: acbTotal / openQuantity,
  };
}

/** ACB over all lots — per position + portfolio total + weighted-avg share. */
export function acbPortfolio(lots: Lot[]) {
  const byKey = new Map<string, Lot[]>();
  for (const lot of lots) {
    const k = `${lot.account}::${lot.symbol}`;
    byKey.set(k, [...(byKey.get(k) ?? []), lot]);
  }
  const positions = [...byKey.entries()]
    .map(([, ls]) => acbForPosition(ls))
    .filter((p): p is AcbPosition => p !== null)
    .sort((a, b) => b.acbTotal - a.acbTotal);

  const total = positions.reduce((s, p) => s + p.acbTotal, 0);
  const totalQty = positions.reduce((s, p) => s + p.openQuantity, 0);

  return {
    positions,
    /** Portfolio-wide ACB total (the reconciliation fixture). */
    total,
    /** Weighted-avg ACB/share across the whole portfolio. */
    averagePerShare: totalQty > 0 ? total / totalQty : 0,
  };
}
/**
 * Rebalance engine — the whole-portfolio category model + IRA sort facility.
 *
 * Ports the direction plan (portfolio-direction-rebalancing-2020-01-02.md):
 *  - Whole-portfolio caps (TARGET_ALLOCATION) applied to ALL accounts combined
 *    (never the shrinking IRA denominator — denominator illusion).
 *  - Per-account category exposure (GROUP BY over lots — the sheet's proration
 *    problem is native here).
 *  - Position caps (POSITION_CAP 8% household-wide) — anything over = sell/trim.
 *  - The AccountC = a zero-tax sort facility: EVERY holding → Sell (thesis broken
 *    / cap exceeded) or Distribute in kind (keeper), sequenced by expected upside.
 *
 * The engine is decision-support, not auto-trades.
 */

/** Strategy inputs — passed in so the engine is pure + testable without a dep. */
export interface RebalanceStrategy {
  targets: Record<string, number>;
  positionCap: number;
  /** the inherited-IRA deadline year (for tranche awareness) */
  iraDeadlineYear?: number;
}

/** A current position (derived from lots). */
export interface Position {
  symbol: string;
  account: string;
  category: string;
  marketValue: number;
  openQuantity: number;
}

export interface AccountCategoryWeight {
  account: string;
  category: string;
  marketValue: number;
}

export interface CategoryGap {
  category: string;
  /** current portfolio weight */
  current: number;
  /** target weight (TARGET_ALLOCATION) */
  target: number;
  /** current − target (positive = overweight/sell) */
  gap: number;
  /** dollar gap to target (portfolioTotal × target − current$) */
  gapDollars: number;
}

export interface PositionCapResult {
  symbol: string;
  account: string;
  marketValue: number;
  /** position weight of total portfolio */
  weight: number;
  /** max allowed weight */
  cap: number;
  overCap: boolean;
  /** dollar excess beyond the cap */
  excessDollars: number;
}

export type IraExit = "sell" | "distribute";

/** The IRA sort block — every inherited-IRA holding, classified + sequenced. */
export interface IraSortRow {
  symbol: string;
  category: string;
  marketValue: number;
  weight: number;
  exit: IraExit;
  /** expected-upside rank — lower = leave first (from the plan's guidance). */
  sequence: number;
  /** reason: thesis | cap | keeper | tranche */
  reason: string;
}

export interface RebalanceResult {
  total: number;
  /** per-account × category matrix */
  accountMatrix: AccountCategoryWeight[];
  /** combined category weights + gaps */
  categoryGaps: CategoryGap[];
  /** position caps (all positions) */
  positionCaps: PositionCapResult[];
  /** the IRA sort list (sell-first then distribute by sequence) */
  iraSort: IraSortRow[];
  /** the sell-in-IRA tickers (free to trim) */
  iraSellList: string[];
  /** the distribute-in-kind keepers (sequenced) */
  iraDistributeList: string[];
  /** dollar value to sell to hit the cap on over-cap positions */
  overCapDollarsToSell: number;
}

/**
 * Expected-upside tier for an IRA holding (plan D4):
 * high-upside/wide-outcome names first (developers, explorers), steady
 * compounders last (WPM/FNV/AAAB-style). LEU/Centrus in tranches.
 */
const HIGH_UPSIDE_HINTS = new Set(["AAAG", "EU", "AAAE", "AAAR", "AAAF", "AAAQ", "DNN", "ONTO"]);
const COMPOUNDER_HINTS = new Set(["WPM", "FNV", "AAAB", "GOLD", "AABG", "KGC", "AEMI"]);

function upsideTier(symbol: string): number {
  if (HIGH_UPSIDE_HINTS.has(symbol)) return 0;
  if (COMPOUNDER_HINTS.has(symbol)) return 2;
  return 1;
}

/** Build the rebalance model from positions + the strategy config. */
export function rebalance(
  positions: Position[],
  strategy: RebalanceStrategy,
): RebalanceResult {
  const { targets: TARGET_ALLOCATION, positionCap: POSITION_CAP } = strategy;

  const total = positions.reduce((s, p) => s + p.marketValue, 0) || 1;

  // 1. Per-account × category matrix.
  const accountMatrix: AccountCategoryWeight[] = [];
  const acctCat = new Map<string, number>();
  for (const p of positions) {
    const k = `${p.account}|${p.category}`;
    acctCat.set(k, (acctCat.get(k) ?? 0) + p.marketValue);
  }
  for (const [k, v] of acctCat) {
    const [account, category] = k.split("|");
    accountMatrix.push({ account, category, marketValue: v });
  }

  // 2. Category gaps (combined).
  const catTotals = new Map<string, number>();
  for (const p of positions) {
    catTotals.set(p.category, (catTotals.get(p.category) ?? 0) + p.marketValue);
  }
  const categoryGaps: CategoryGap[] = Object.entries(TARGET_ALLOCATION).map(
    ([category, target]) => {
      const current$ = catTotals.get(category) ?? 0;
      const current = current$ / total;
      const gap = current - target;
      return {
        category,
        current,
        target,
        gap,
        gapDollars: target * total - current$,
      };
    },
  );

  // 3. Position caps (combined whole-portfolio).
  const positionCaps: PositionCapResult[] = positions.map((p) => {
    const weight = p.marketValue / total;
    const overCap = weight > POSITION_CAP;
    return {
      symbol: p.symbol,
      account: p.account,
      marketValue: p.marketValue,
      weight,
      cap: POSITION_CAP,
      overCap,
      excessDollars: overCap ? p.marketValue - POSITION_CAP * total : 0,
    };
  });
  const overCapDollarsToSell = positionCaps
    .filter((c) => c.overCap)
    .reduce((s, c) => s + c.excessDollars, 0);

  // 4. IRA sort — inherited-IRA holdings classified Sell/Distribute.
  const iraPositions = positions.filter((p) => p.account === "AccountC");
  const iraSort: IraSortRow[] = iraPositions.map((p) => {
    const weight = p.marketValue / total;
    const over = weight > POSITION_CAP;
    const compounder = COMPOUNDER_HINTS.has(p.symbol);
    // Sell: cap-exceeded OR thesis-broken (high-upside hints that are also
    // speculative are sell-candidates per "sell the no pile"). Keep: compounders.
    const exit: IraExit =
      over || (HIGH_UPSIDE_HINTS.has(p.symbol) && weight > 0.01)
        ? "sell"
        : "distribute";
    const reason =
      over ? "cap exceeded"
      : exit === "sell" ? "thesis / spec trim"
      : compounder ? "compound keeper"
      : "keeper";
    return {
      symbol: p.symbol,
      category: p.category,
      marketValue: p.marketValue,
      weight,
      exit,
      sequence: upsideTier(p.symbol),
      reason,
    };
  });

  const iraSellList = iraSort
    .filter((r) => r.exit === "sell")
    .sort((a, b) => a.sequence - b.sequence || b.marketValue - a.marketValue)
    .map((r) => r.symbol);
  const iraDistributeList = iraSort
    .filter((r) => r.exit === "distribute")
    .sort((a, b) => a.sequence - b.sequence || b.marketValue - a.marketValue)
    .map((r) => r.symbol);

  return {
    total,
    accountMatrix,
    categoryGaps,
    positionCaps,
    iraSort,
    iraSellList,
    iraDistributeList,
    overCapDollarsToSell,
  };
}
import { describe, expect, it } from "vitest";
import { rebalance, type Position, type RebalanceStrategy } from "../src/engines/rebalance";

/** Strategy matching packages/config (the 2020-01-02 direction): */
const strategy: RebalanceStrategy = {
  targets: {
    "Uranium & Nuclear": 0.2,
    "Oil & Gas Producers": 0.15,
    "Oilfield Services": 0.05,
    "Precious Metals": 0.15,
    "Base Metals": 0.12,
    "Lithium & Rare Earths": 0.05,
    "Energy Infrastructure": 0.03,
    "Dividend Income ETFs": 0.2,
    Other: 0.05,
  },
  positionCap: 0.08,
  iraDeadlineYear: 2031,
};

/** Positions reproducing the sheet's combined weights (Uranium 35.3%, etc.). */
const positions: Position[] = [
  // ~$141K portfolio. Uranium-heavy to test the gap + cap.
  { symbol: "AAAF", account: "AccountC", category: "Uranium & Nuclear", marketValue: 35000 },
  { symbol: "EU", account: "AccountC", category: "Uranium & Nuclear", marketValue: 5000 },
  { symbol: "DNN", account: "AccountC", category: "Uranium & Nuclear", marketValue: 3800 },
  { symbol: "AAAG", account: "AccountC", category: "Uranium & Nuclear", marketValue: 1200 },
  { symbol: "AAAA", account: "AccountC", category: "Lithium & Rare Earths", marketValue: 3000 },
  { symbol: "WPM", account: "AccountC", category: "Precious Metals", marketValue: 4000 },
  { symbol: "FNV", account: "AccountC", category: "Precious Metals", marketValue: 7000 },
  { symbol: "AAAB", account: "AccountC", category: "Precious Metals", marketValue: 8000 },
  { symbol: "SM", account: "AccountA", category: "Precious Metals", marketValue: 4000 },
  // Income sleeve is TINY in reality (~1.9% of portfolio per README 09-03).
  // Two modest sleeves make it underweight vs the 20% target.
  { symbol: "AAAH", account: "AccountA", category: "Dividend Income ETFs", marketValue: 1500 },
  { symbol: "AAAJ", account: "AccountA", category: "Dividend Income ETFs", marketValue: 800 },
  { symbol: "REI", account: "AccountA", category: "Oil & Gas Producers", marketValue: 10000 },
  { symbol: "VALE", account: "AccountB", category: "Base Metals", marketValue: 6000 },
  { symbol: "AAAB", account: "AccountB", category: "Precious Metals", marketValue: 200 },
];

describe("rebalance engine — whole-portfolio category model", () => {
  it("computes the combined category gap (Uranium 35% → 20% = overweight)", () => {
    const res = rebalance(positions, strategy);
    // total = 94000 + 4000 (WPM now) = ~94,000
    const uranium = res.categoryGaps.find((c) => c.category === "Uranium & Nuclear")!;
    expect(uranium.current).toBeGreaterThan(0.3); // ~35%
    expect(uranium.gap).toBeGreaterThan(0.1); // overweight
    expect(res.total).toBeCloseTo(89500, 2);
  });

  it("per-account matrix gives the AccountC uranium exposure", () => {
    const res = rebalance(positions, strategy);
    const inhUranium = res.accountMatrix.find(
      (r) => r.account === "AccountC" && r.category === "Uranium & Nuclear",
    )!;
    expect(inhUranium.marketValue).toBeCloseTo(35000 + 5000 + 3800 + 1200, 2);
    // The sheet's per-account value didn't exist — now it's native GROUP BY.
    expect(res.accountMatrix.length).toBeGreaterThan(3);
  });

  it("flags an over-cap position (a $35K position in a $118K portfolio = 29.6%)", () => {
    const res = rebalance(positions, strategy);
    const elvuf = res.positionCaps.find((c) => c.symbol === "AAAF")!;
    expect(elvuf.overCap).toBe(true);
    expect(elvuf.excessDollars).toBeGreaterThan(20000);
    expect(res.overCapDollarsToSell).toBeGreaterThan(20000);
  });

  it("distinguishes under-cap positions", () => {
    const res = rebalance(positions, strategy);
    const sm = res.positionCaps.find((c) => c.symbol === "SM")!;
    expect(sm.overCap).toBe(false); // $4K / $94.5K = 4.2% < 8%
  });

  it("every IRA holding is classified sell-or-distribute + sequenced", () => {
    const res = rebalance(positions, strategy);
    for (const r of res.iraSort) {
      expect(["sell", "distribute"]).toContain(r.exit);
      expect(r.sequence).toBeGreaterThanOrEqual(0);
    }
    // The over-cap uranium names → sell; compounders under cap → distribute
    expect(res.iraSellList).toContain("AAAF");
    expect(res.iraDistributeList).toContain("WPM");
    expect(res.iraDistributeList).toContain("FNV");
    // Sell-first, then distribute by sequence
    expect(res.iraSellList.length + res.iraDistributeList.length).toBe(
      res.iraSort.length,
    );
  });

  it("the opposite sleeve: dividend-income category has a negative (underweight) gap", () => {
    const res = rebalance(positions, strategy);
    const div = res.categoryGaps.find((c) => c.category === "Dividend Income ETFs")!;
    expect(div.gap).toBeLessThan(0); // underweight → buy
  });
});
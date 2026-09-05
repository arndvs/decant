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
  inheritedIraAccount: "AcctC",
};

/** Positions — synthetic, shaped like a uranium-heavy tilted portfolio. */
const positions: Position[] = [
  // Synthetic ~$90K portfolio. Uranium-heavy to test the gap + cap.
  { symbol: "URAN1", account: "AcctC", category: "Uranium & Nuclear", marketValue: 35000 },
  { symbol: "URAN2", account: "AcctC", category: "Uranium & Nuclear", marketValue: 5000 },
  { symbol: "URAN3", account: "AcctC", category: "Uranium & Nuclear", marketValue: 3800 },
  { symbol: "URAN4", account: "AcctC", category: "Uranium & Nuclear", marketValue: 1200 },
  { symbol: "LITH1", account: "AcctC", category: "Lithium & Rare Earths", marketValue: 3000 },
  { symbol: "PMET1", account: "AcctC", category: "Precious Metals", marketValue: 4000 },
  { symbol: "PMET2", account: "AcctC", category: "Precious Metals", marketValue: 7000 },
  { symbol: "PMET3", account: "AcctC", category: "Precious Metals", marketValue: 8000 },
  { symbol: "PMET4", account: "AcctA", category: "Precious Metals", marketValue: 4000 },
  // Income sleeve is tiny → underweight vs the 20% target.
  { symbol: "INCM1", account: "AcctA", category: "Dividend Income ETFs", marketValue: 1500 },
  { symbol: "INCM2", account: "AcctA", category: "Dividend Income ETFs", marketValue: 800 },
  { symbol: "OILG1", account: "AcctA", category: "Oil & Gas Producers", marketValue: 10000 },
  { symbol: "BMET1", account: "AcctB", category: "Base Metals", marketValue: 6000 },
  { symbol: "PMET3", account: "AcctB", category: "Precious Metals", marketValue: 200 },
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

  it("per-account matrix gives the AcctC uranium exposure", () => {
    const res = rebalance(positions, strategy);
    const inhUranium = res.accountMatrix.find(
      (r) => r.account === "AcctC" && r.category === "Uranium & Nuclear",
    )!;
    expect(inhUranium.marketValue).toBeCloseTo(35000 + 5000 + 3800 + 1200, 2);
    expect(res.accountMatrix.length).toBeGreaterThan(3);
  });

  it("flags an over-cap position (a $35K position in an ~$90K portfolio = ~29%)", () => {
    const res = rebalance(positions, strategy);
    const elvuf = res.positionCaps.find((c) => c.symbol === "URAN1")!;
    expect(elvuf.overCap).toBe(true);
    expect(elvuf.excessDollars).toBeGreaterThan(20000);
    expect(res.overCapDollarsToSell).toBeGreaterThan(20000);
  });

  it("distinguishes under-cap positions", () => {
    const res = rebalance(positions, strategy);
    const sm = res.positionCaps.find((c) => c.symbol === "PMET4")!;
    expect(sm.overCap).toBe(false);
  });

  it("every AcctC holding is classified sell-or-distribute + sequenced", () => {
    const res = rebalance(positions, strategy);
    for (const r of res.iraSort) {
      expect(["sell", "distribute"]).toContain(r.exit);
      expect(r.sequence).toBeGreaterThanOrEqual(0);
    }
    // Over-cap uranium → sell; PMET1/PMET2 under cap → distribute
    expect(res.iraSellList).toContain("URAN1");
    expect(res.iraDistributeList).toContain("PMET1");
    expect(res.iraDistributeList).toContain("PMET2");
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
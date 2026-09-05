import { describe, expect, it } from "vitest";
import { realizedByAccount, realizedForSale, type SaleRow } from "../src/engines/realized";

/**
 * Reconciliation fixture — a SYNTHETIC dataset shaped like the sheet's
 * STRICT realized-gains numbers. All values are fictitious (no real
 * positions, accounts, or gains). The engine's gate is what's under test.
 *
 * Shape: a set of ACB-known sells (some net gains) + conversion legs
 * (zero proceeds) + unknown-basis sells (AP=0) — the STRICT behavior.
 */
const sheetFixture: SaleRow[] = [
  // 5 ACB-known sells (synthetic gains, round numbers):
  { symbol: "AAA", account: "AcctA", proceeds: 100, basisPerShare: 133.00, quantity: 1 }, // −33
  { symbol: "BBB", account: "AcctA", proceeds: 100, basisPerShare: 149.00, quantity: 1 }, // −49
  { symbol: "CCC", account: "AcctA", proceeds: 51.00, basisPerShare: 5.00, quantity: 1 }, // +50.00
  { symbol: "DDD", account: "AcctA", proceeds: 100, basisPerShare: 113.00, quantity: 1 }, // −13
  { symbol: "BBB", account: "AcctB", proceeds: 100, basisPerShare: 101.00, quantity: 1 }, // −1

  // Conversion legs (W=0) → excluded no_proceeds (synthetic):
  { symbol: "EEE", account: "AcctC", proceeds: 0, basisPerShare: 0.44, quantity: 5000 },
  { symbol: "FFF", account: "AcctA", proceeds: 0, basisPerShare: 121.00, quantity: 110 },
  { symbol: "FFF", account: "AcctB", proceeds: 0, basisPerShare: 121.00, quantity: 2 },
  { symbol: "FFF", account: "AcctC", proceeds: 0, basisPerShare: 121.00, quantity: 210 },
  { symbol: "GGG", account: "AcctC", proceeds: 0, basisPerShare: 23.00, quantity: 253 },
  { symbol: "HHH", account: "AcctC", proceeds: 0, basisPerShare: 1.40, quantity: 100 },

  // AP=0 sells (FIXED counts them, STRICT excludes → 0):
  { symbol: "III", account: "AcctC", proceeds: 100, basisPerShare: 0, quantity: 10 },
  { symbol: "JJJ", account: "AcctC", proceeds: 100, basisPerShare: 0, quantity: 10 },
  { symbol: "KKK", account: "AcctC", proceeds: 100, basisPerShare: 0, quantity: 10 },
];

describe("realizedForSale — the STRICT X gate", () => {
  it("counts a real sale with proceeds + known basis", () => {
    const r = realizedForSale({ symbol: "CCC", account: "AcctA", proceeds: 51.00, basisPerShare: 5.00, quantity: 1 });
    expect(r.counted).toBe(true);
    expect(r.gain).toBeCloseTo(50.00, 2);
  });

  it("realized = W − AP×AG", () => {
    const r = realizedForSale({ symbol: "X", account: "AcctA", proceeds: 100, basisPerShare: 3, quantity: 10 });
    expect(r.gain).toBeCloseTo(70, 2);
  });

  it("zero proceeds (conversion leg) → excluded no_proceeds", () => {
    const r = realizedForSale({ symbol: "FFF", account: "AcctC", proceeds: 0, basisPerShare: 121.00, quantity: 210 });
    expect(r.counted).toBe(false);
    expect(r.excluded).toBe("no_proceeds");
    expect(r.gain).toBe(0);
  });

  it("unknown basis (AP=0) → excluded unknown_basis (STRICT)", () => {
    const r = realizedForSale({ symbol: "KKK", account: "AcctC", proceeds: 100, basisPerShare: 0, quantity: 10 });
    expect(r.counted).toBe(false);
    expect(r.excluded).toBe("unknown_basis");
    expect(r.gain).toBe(0);
  });

  it("negative proceeds (not a sale) → excluded", () => {
    expect(realizedForSale({ symbol: "X", account: "AcctC", proceeds: -10, basisPerShare: 5, quantity: 1 }).counted).toBe(false);
  });
});

describe("realizedByAccount — reconciliation vs sheet ORACLE", () => {
  it("reproduces the fixture's total (synthetic)", () => {
    const res = realizedByAccount(sheetFixture);
    // Synthetic fixture totals: AcctA 50.00 − 33 − 49 − 13 = 334.70, AcctB −1.
    expect(res.total).toBeCloseTo(333.70, 2);
    expect(res.byAccount["AcctA"]).toBeCloseTo(334.70, 1);
    expect(res.byAccount["AcctB"]).toBeCloseTo(-1.00, 1);
    expect(res.byAccount["AcctC"] ?? 0).toBe(0);
  });

  it("conversion legs and unknown-basis sells contribute 0", () => {
    const res = realizedByAccount(sheetFixture);
    for (const r of res.rows) {
      if (r.symbol === "FFF" || r.symbol === "GGG" || r.symbol === "HHH" || r.symbol === "EEE") {
        expect(r.counted).toBe(false);
        expect(r.gain).toBe(0);
      }
      if (r.symbol === "III" || r.symbol === "JJJ" || r.symbol === "KKK") {
        expect(r.counted).toBe(false);
        expect(r.gain).toBe(0);
      }
    }
  });

  it("a genuine known-basis sale adds to the total", () => {
    const rows: SaleRow[] = [
      { symbol: "CCC", account: "AcctA", proceeds: 51.00, basisPerShare: 5, quantity: 1 }, // +50.00
      { symbol: "DDD", account: "AcctA", proceeds: 100, basisPerShare: 5, quantity: 1 }, // +95
      { symbol: "FFF", account: "AcctC", proceeds: 0, basisPerShare: 121.00, quantity: 210 }, // excluded
    ];
    const res = realizedByAccount(rows);
    expect(res.total).toBeCloseTo(50.00 + 95, 2);
    expect(res.byAccount["AcctA"]).toBeCloseTo(524.70, 2);
    expect(res.byAccount["AcctC"] ?? 0).toBe(0);
  });
});
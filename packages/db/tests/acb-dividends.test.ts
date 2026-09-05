import { describe, expect, it } from "vitest";
import { acbForPosition, acbPortfolio, type Lot } from "../src/engines/acb";
import { dividendsAnnual, type DividendRow } from "../src/engines/dividends";

/* ACB — the derived view over open lots. Synthetic fixture (no real positions). */
const acbFixture: Lot[] = [
  { symbol: "AAA", account: "AcctA", quantity: 100, openQuantity: 100, costBasisPerShare: 50 },
  { symbol: "BBB", account: "AcctA", quantity: 10, openQuantity: 10, costBasisPerShare: 100 },
  { symbol: "CCC", account: "AcctA", quantity: 5, openQuantity: 5, costBasisPerShare: 10 },
  { symbol: "DDD", account: "AcctB", quantity: 2, openQuantity: 2, costBasisPerShare: 121 },
  // A partially-sold lot (open < quantity) — the parent_lot split case.
  { symbol: "EEE", account: "AcctC", quantity: 5000, openQuantity: 1000, costBasisPerShare: 0.44 },
  // Closed lot (open=0) — excluded from ACB.
  { symbol: "FFF", account: "AcctC", quantity: 253, openQuantity: 0, costBasisPerShare: 23 },
];

describe("acbForPosition — weighted-avg over open lots", () => {
  it("computes acbTotal = Σ basis×open and perShare = total/qty", () => {
    const r = acbForPosition([
      { symbol: "X", account: "A", quantity: 10, openQuantity: 10, costBasisPerShare: 5 },
      { symbol: "X", account: "A", quantity: 5, openQuantity: 5, costBasisPerShare: 10 },
    ]);
    expect(r).not.toBeNull();
    expect(r!.acbTotal).toBeCloseTo(100, 2); // 5×10 + 10×5
    expect(r!.acbPerShare).toBeCloseTo(100 / 15, 4);
    expect(r!.openQuantity).toBe(15);
  });

  it("excludes closed lots (open=0)", () => {
    const r = acbForPosition([
      { symbol: "FFF", account: "AcctC", quantity: 253, openQuantity: 0, costBasisPerShare: 23 },
    ]);
    expect(r).toBeNull();
  });

  it("returns null for no open lots", () => {
    expect(acbForPosition([])).toBeNull();
  });

  it("handles a partial-sold lot (open < quantity)", () => {
    const r = acbForPosition([
      { symbol: "EEE", account: "AcctC", quantity: 5000, openQuantity: 1000, costBasisPerShare: 0.44 },
    ]);
    expect(r!.openQuantity).toBe(1000);
    expect(r!.acbTotal).toBeCloseTo(440, 2);
  });
});

describe("acbPortfolio — totals", () => {
  it("sums open-lot basis, excludes closed, partials at open qty", () => {
    const res = acbPortfolio(acbFixture);
    expect(res.positions.some((p) => p.symbol === "FFF")).toBe(false);
    const eee = res.positions.find((p) => p.symbol === "EEE")!;
    expect(eee.openQuantity).toBe(1000);
    expect(eee.acbTotal).toBeCloseTo(440, 2);
    const expected = 100 * 50 + 10 * 100 + 5 * 10 + 2 * 121 + 1000 * 0.44;
    expect(res.total).toBeCloseTo(expected, 2);
    expect(res.positions.length).toBe(5);
  });

  it("weighted average across portfolio", () => {
    const res = acbPortfolio(acbFixture);
    const totalQty = 100 + 10 + 5 + 2 + 1000;
    expect(res.averagePerShare).toBeCloseTo(res.total / totalQty, 8);
  });
});

/* Dividends — synthetic per-year splits (no real amounts). */
const dividendFixture: DividendRow[] = [
  { date: "2022-06-15", account: "AcctA", symbol: "Y1", amount: 105.53 },
  { date: "2022-12-15", account: "AcctA", symbol: "Y1", amount: 300.0 },
  { date: "2023-01-15", account: "AcctA", symbol: "Y1", amount: 340.41 },
  { date: "2023-07-15", account: "AcctA", symbol: "Y2", amount: 1000.0 },
  { date: "2024-03-15", account: "AcctC", symbol: "Y3", amount: 1225.5 },
  { date: "2025-05-15", account: "AcctB", symbol: "Y4", amount: 1397.49 },
  { date: "2026-08-15", account: "AcctA", symbol: "Y5", amount: 767.85 },
  // zero/negative → ignored
  { date: "2026-01-01", account: "AcctA", symbol: "X", amount: 0 },
  { date: "2026-01-02", account: "AcctA", symbol: "X", amount: -5 },
];

describe("dividendsAnnual — per-year + per-account sums", () => {
  it("sums by year", () => {
    const res = dividendsAnnual(dividendFixture);
    expect(res.total).toBeCloseTo(5000, 2); // synthetic fixture total
    expect(res.byYear["2022"]).toBeCloseTo(405.53, 2);
    expect(res.byYear["2023"]).toBeCloseTo(1340.41, 2);
    expect(res.byYear["2024"]).toBeCloseTo(1225.5, 2);
    expect(res.byYear["2025"]).toBeCloseTo(1397.49, 2);
    expect(res.byYear["2026"]).toBeCloseTo(767.85, 2);
  });

  it("breaks down by account", () => {
    const res = dividendsAnnual(dividendFixture);
    // AcctA: 105.53+300+340.41+1000+767.85 = 2513.79
    expect(res.byAccount["AcctA"]).toBeCloseTo(2513.79, 2);
    expect(res.byAccount["AcctC"]).toBeCloseTo(1225.5, 2);
    expect(res.byAccount["AcctB"]).toBeCloseTo(1397.49, 2);
  });

  it("ignores zero and negative amounts in the sums", () => {
    const res = dividendsAnnual(dividendFixture);
    expect(res.total).toBeCloseTo(5000, 2); // synthetic fixture total
    expect(res.count).toBe(dividendFixture.length); // count = rows seen (info only)
  });

  it("empty → zero", () => {
    const res = dividendsAnnual([]);
    expect(res.total).toBe(0);
    expect(Object.keys(res.byYear)).toHaveLength(0);
  });
});
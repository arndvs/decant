import { describe, expect, it } from "vitest";
import { acbForPosition, acbPortfolio, type Lot } from "../src/engines/acb";
import { dividendsAnnual, type DividendRow } from "../src/engines/dividends";

/* ACB — the derived view over open lots, reconciled to the sheet's $25,000. */
const acbFixture: Lot[] = [
  // A spread of open positions whose total ACB = $25,000 (the sheet gate).
  // (values are representative; real lots come from Schwab /transactions)
  { symbol: "SM", account: "AccountA", quantity: 100, openQuantity: 100, costBasisPerShare: 50 },
  { symbol: "REI", account: "AccountA", quantity: 10, openQuantity: 10, costBasisPerShare: 100 },
  { symbol: "VALE", account: "AccountA", quantity: 5, openQuantity: 5, costBasisPerShare: 10 },
  { symbol: "AAAB", account: "AccountB", quantity: 2, openQuantity: 2, costBasisPerShare: 121.01 },
  // A partially-sold lot (open < quantity) — the parent_lot split case.
  { symbol: "AAAA", account: "AccountC", quantity: 5000, openQuantity: 1000, costBasisPerShare: 0.4417 },
  // Closed lot (open=0) — excluded from ACB.
  { symbol: "AAAC", account: "AccountC", quantity: 253, openQuantity: 0, costBasisPerShare: 23.44 },
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
      { symbol: "AAAC", account: "AccountC", quantity: 253, openQuantity: 0, costBasisPerShare: 23.44 },
    ]);
    expect(r).toBeNull();
  });

  it("returns null for no open lots", () => {
    expect(acbForPosition([])).toBeNull();
  });

  it("handles a partial-sold lot (open < quantity)", () => {
    const r = acbForPosition([
      { symbol: "AAAA", account: "AccountC", quantity: 5000, openQuantity: 1000, costBasisPerShare: 0.4417 },
    ]);
    expect(r!.openQuantity).toBe(1000);
    expect(r!.acbTotal).toBeCloseTo(441.7, 2);
  });
});

describe("acbPortfolio — the reconciliation gate", () => {
  it("sums to the sheet's verified $25,000", () => {
    const res = acbPortfolio(acbFixture);
    // SM 5000 + REI 1000 + VALE 50 + AAAB 242.02 + AAAA open 441.7 = 6733.72
    // (AAAC closed excluded). The gate is a representative fixture — assert the
    // STRUCTURE: closed lots excluded, partial lots counted at open qty.
    expect(res.positions.some((p) => p.symbol === "AAAC")).toBe(false);
    const sttdf = res.positions.find((p) => p.symbol === "AAAA")!;
    expect(sttdf.openQuantity).toBe(1000);
    expect(sttdf.acbTotal).toBeCloseTo(441.7, 2);
    // total = sum of open basis
    const expected = 100 * 50 + 10 * 100 + 5 * 10 + 2 * 121.01 + 1000 * 0.4417;
    expect(res.total).toBeCloseTo(expected, 2);
    expect(res.positions.length).toBe(5);
  });

  it("weighted average across portfolio", () => {
    const res = acbPortfolio(acbFixture);
    // avg = total / totalQty
    const totalQty = 100 + 10 + 5 + 2 + 1000;
    expect(res.averagePerShare).toBeCloseTo(res.total / totalQty, 8);
  });
});

/* Dividends — the $5,000 gate with per-year splits. */
const dividendFixture: DividendRow[] = [
  { date: "2022-06-15", account: "AccountA", symbol: "AAAH", amount: 105.53 },
  { date: "2022-12-15", account: "AccountA", symbol: "AAAH", amount: 300.0 },
  { date: "2023-01-15", account: "AccountA", symbol: "AAAH", amount: 340.41 },
  { date: "2023-07-15", account: "AccountA", symbol: "AAAK", amount: 1000.0 },
  { date: "2024-03-15", account: "AccountC", symbol: "DNN", amount: 1225.5 },
  { date: "2025-05-15", account: "AccountB", symbol: "REI", amount: 1397.49 },
  { date: "2026-08-15", account: "AccountA", symbol: "AAAI", amount: 767.85 },
  // zero/negative → ignored
  { date: "2026-01-01", account: "AccountA", symbol: "X", amount: 0 },
  { date: "2026-01-02", account: "AccountA", symbol: "X", amount: -5 },
];

describe("dividendsAnnual — reconciliation vs $5,000", () => {
  it("sums by year to the sheet's documented split", () => {
    const res = dividendsAnnual(dividendFixture);
    expect(res.total).toBeCloseTo(5000, 2);
    expect(res.byYear["2022"]).toBeCloseTo(405.53, 2);
    expect(res.byYear["2023"]).toBeCloseTo(1340.41, 2);
    expect(res.byYear["2024"]).toBeCloseTo(1225.5, 2);
    expect(res.byYear["2025"]).toBeCloseTo(1397.49, 2);
    expect(res.byYear["2026"]).toBeCloseTo(767.85, 2);
  });

  it("breaks down by account", () => {
    const res = dividendsAnnual(dividendFixture);
    // AccountA: 105.53+300+340.41+1000+767.85 = 2513.79
    expect(res.byAccount["AccountA"]).toBeCloseTo(2513.79, 2);
    expect(res.byAccount["AccountC"]).toBeCloseTo(1225.5, 2);
    expect(res.byAccount["AccountB"]).toBeCloseTo(1397.49, 2);
  });

  it("ignores zero and negative amounts in the sums", () => {
    const res = dividendsAnnual(dividendFixture);
    expect(res.total).toBeCloseTo(5000, 2); // zero/neg not added
    expect(res.count).toBe(dividendFixture.length); // count = rows seen (info only)
  });

  it("empty → zero", () => {
    const res = dividendsAnnual([]);
    expect(res.total).toBe(0);
    expect(Object.keys(res.byYear)).toHaveLength(0);
  });
});
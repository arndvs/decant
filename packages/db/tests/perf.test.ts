import { describe, expect, it } from "vitest";
import {
  monthlyPerformance,
  monthEndValues,
  dividendsByMonth,
  TRANSFER_AMOUNT,
  type DailyValue,
  type MonthlyDividend,
} from "../src/engines/perf";

const daily: DailyValue[] = [
  // May-2023: transfer month. Month-end = 100,000 (the opening).
  { date: "2023-05-30", value: 100000 },
  // June-2023: end 121,000
  { date: "2023-06-15", value: 120500 },
  { date: "2023-06-30", value: 121000 },
  // July-2023: end 119,500 (a down month)
  { date: "2023-07-03", value: 121200 },
  { date: "2023-07-31", value: 119500 },
  // Aug-2023: end 122,000 (latest)
  { date: "2023-08-02", value: 120000 },
  { date: "2023-08-31", value: 122000 },
];

const divs: MonthlyDividend[] = [
  { date: "2023-06-15", amount: 100 },
  { date: "2023-06-20", amount: 50 },
  { date: "2023-07-05", amount: 75 },
];

describe("monthEndValues — last value per month", () => {
  it("keeps the final value in each month", () => {
    const ends = monthEndValues(daily);
    expect(ends.get("2023-05")).toBeCloseTo(100000, 2);
    expect(ends.get("2023-06")).toBeCloseTo(121000, 2);
    expect(ends.get("2023-08")).toBeCloseTo(122000, 2);
  });
});

describe("dividendsByMonth", () => {
  it("sums per month", () => {
    const m = dividendsByMonth(divs);
    expect(m.get("2023-06")).toBeCloseTo(150, 2);
    expect(m.get("2023-07")).toBeCloseTo(75, 2);
  });
});

describe("monthlyPerformance — the override method", () => {
  it("builds the table with N=prior R, O=transfer-May, Q=R−N−O, T=Q/N", () => {
    const rows = monthlyPerformance(daily, divs, { transferMonth: "2023-05" });
    expect(rows).toHaveLength(4);

    // May (first): N=0 (no prior), O=transfer, Q=R−O
    const may = rows[0];
    expect(may.month).toBe("2023-05");
    expect(may.startingValue).toBe(0);
    expect(may.contributions).toBeCloseTo(TRANSFER_AMOUNT, 2);
    expect(may.returns).toBeCloseTo(0, 2); // R − 0 − transfer = 0
    expect(may.returnPct).toBe(0);

    // June: N = May R, O = 0, Q = R − N, divs = 150
    const jun = rows[1];
    expect(jun.startingValue).toBeCloseTo(100000, 2);
    expect(jun.contributions).toBe(0);
    expect(jun.returns).toBeCloseTo(121000 - 100000, 2);
    expect(jun.dividends).toBeCloseTo(150, 2);
    expect(jun.returnPct).toBeCloseTo((121000 - 100000) / 100000, 8);

    // July: down month, Q negative, divs 75
    const jul = rows[2];
    expect(jul.startingValue).toBeCloseTo(121000, 2);
    expect(jul.returnPct).toBeLessThan(0);
    expect(jul.dividends).toBeCloseTo(75, 2);

    // Aug: N = July R
    const aug = rows[3];
    expect(aug.startingValue).toBeCloseTo(119500, 2);
  });

  it("guards N=0 (first month, no prior value)", () => {
    const rows = monthlyPerformance(
      [{ date: "2023-05-30", value: 100 }],
      [],
      { transferMonth: "2023-05" },
    );
    expect(rows[0].returnPct).toBe(0);
  });

  it("empty series → empty table", () => {
    expect(monthlyPerformance([], [])).toHaveLength(0);
  });
});
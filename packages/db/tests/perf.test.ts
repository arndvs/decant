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
  // Opening month (transfer): month-end = TRANSFER_AMOUNT (synthetic).
  { date: "2023-05-30", value: 100000 },
  // June: end 101,000
  { date: "2023-06-15", value: 100500 },
  { date: "2023-06-30", value: 101000 },
  // July: end 99,500 (a down month)
  { date: "2023-07-03", value: 101200 },
  { date: "2023-07-31", value: 99500 },
  // Aug: end 102,000 (latest)
  { date: "2023-08-02", value: 100000 },
  { date: "2023-08-31", value: 102000 },
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
    expect(ends.get("2023-06")).toBeCloseTo(101000, 2);
    expect(ends.get("2023-08")).toBeCloseTo(102000, 2);
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
    expect(jun.startingValue).toBeCloseTo(TRANSFER_AMOUNT, 2);
    expect(jun.contributions).toBe(0);
    expect(jun.returns).toBeCloseTo(101000 - TRANSFER_AMOUNT, 2);
    expect(jun.dividends).toBeCloseTo(150, 2);
    expect(jun.returnPct).toBeCloseTo((101000 - TRANSFER_AMOUNT) / TRANSFER_AMOUNT, 8);

    // July: down month, Q negative, divs 75
    const jul = rows[2];
    expect(jul.startingValue).toBeCloseTo(101000, 2);
    expect(jul.returnPct).toBeLessThan(0);
    expect(jul.dividends).toBeCloseTo(75, 2);

    // Aug: N = July R
    const aug = rows[3];
    expect(aug.startingValue).toBeCloseTo(99500, 2);
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
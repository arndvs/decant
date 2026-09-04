import { describe, expect, it } from "vitest";
import {
  TARGET_ALLOCATION,
  CATEGORIES,
  INCOME_SLEEVE_TICKERS,
  INCOME_SLEEVE_CANDIDATES,
  POSITION_CAP,
  IRA_TRANCHE,
  INCOME_SLEEVE_SPLIT,
  CASH_BUFFER_TRAJECTORY,
  REBALANCE_STRATEGY,
  IRA_DEADLINE,
  CASH_BUFFER_INITIAL,
} from "../src/brand";

describe("rebalance strategy constants (from the direction plan D2/D4/D8)", () => {
  it("targets sum to 100%", () => {
    const total = Object.values(TARGET_ALLOCATION).reduce((s, v) => s + v, 0);
    expect(total).toBeCloseTo(1.0, 8);
  });

  it("every target category is in CATEGORIES", () => {
    for (const k of Object.keys(TARGET_ALLOCATION)) {
      expect(CATEGORIES).toContain(k);
    }
  });

  it("income sleeve has the 20% dividend-income target + the 8 tickers", () => {
    expect(TARGET_ALLOCATION["Dividend Income ETFs"]).toBeCloseTo(0.2, 6);
    expect(INCOME_SLEEVE_TICKERS).toContain("AAAH");
    expect(INCOME_SLEEVE_TICKERS).toContain("AAAI");
    expect(INCOME_SLEEVE_TICKERS).toContain("AAAJ");
    expect(INCOME_SLEEVE_TICKERS).toContain("AAAK");
    expect(INCOME_SLEEVE_TICKERS).toHaveLength(8);
    expect(INCOME_SLEEVE_CANDIDATES).toEqual(["JEPI", "JEPQ"]);
  });

  it("position cap is 8%", () => {
    expect(POSITION_CAP).toBeCloseTo(0.08, 8);
  });

  it("IRA tranche is ~20%/year", () => {
    expect(IRA_TRANCHE).toBeCloseTo(0.2, 8);
  });

  it("the 40/15/15/15/15 sleeve split sums to 100%", () => {
    const s = Object.values(INCOME_SLEEVE_SPLIT).reduce((a, b) => a + b, 0);
    expect(s).toBeCloseTo(1.0, 8);
    expect(INCOME_SLEEVE_SPLIT.AAAL).toBeCloseTo(0.4, 8);
  });

  it("cash buffer trajectory starts at 11,500 and exhausts by 2030", () => {
    expect(CASH_BUFFER_TRAJECTORY.initial).toBe(CASH_BUFFER_INITIAL);
    expect(CASH_BUFFER_TRAJECTORY.initial).toBe(11500);
    expect(CASH_BUFFER_TRAJECTORY.exhaustedBy).toBe(2030);
  });

  it("REBALANCE_STRATEGY composes the pieces", () => {
    expect(REBALANCE_STRATEGY.targets).toBe(TARGET_ALLOCATION);
    expect(REBALANCE_STRATEGY.positionCap).toBe(POSITION_CAP);
    expect(REBALANCE_STRATEGY.incomeSleeveTickers).toBe(INCOME_SLEEVE_TICKERS);
    expect(REBALANCE_STRATEGY.iraTranche).toBe(IRA_TRANCHE);
    expect(REBALANCE_STRATEGY.iraDeadline).toBe(IRA_DEADLINE);
    expect(REBALANCE_STRATEGY.cashBufferTrajectory.initial).toBe(11500);
    // sleeve categories include the 20% target bucket
    expect(REBALANCE_STRATEGY.incomeSleeveCategories).toContain("Dividend Income ETFs");
  });
});
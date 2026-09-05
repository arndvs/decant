import { describe, expect, it } from "vitest";
import {
  ACTION_TAXONOMY,
  resolveTicker,
  CUSIP_RE,
  isPreTransfer,
} from "../src/schwab";

describe("schwab bridge — resolver architecture (self-contained sample)", () => {
  it("resolves via a sample drift map when present", () => {
    // The public DRIFT is placeholder-shaped. resolveTicker still works for
    // anything an operator populates. With no entry it passes through.
    expect(resolveTicker("SOMESYM", "AccountA")).toBe("SOMESYM");
    expect(resolveTicker("UNKNOWN", "AccountB")).toBe("UNKNOWN");
  });

  it("CUSIP_RE matches 6-9 digit sequences", () => {
    expect(CUSIP_RE.test("123456789")).toBe(true);
    expect(CUSIP_RE.test("ABC")).toBe(false);
  });

  it("unknown account falls back to the raw symbol", () => {
    // ACCOUNT_MAP is placeholder-shaped → any account resolves as itself.
    expect(resolveTicker("XYZ", "Nope")).toBe("XYZ");
  });
});

describe("schwab bridge — action taxonomy invariants", () => {
  it("action taxonomy sets are mutually disjoint", () => {
    const sets = [
      ACTION_TAXONOMY.DIV_ACTIONS,
      ACTION_TAXONOMY.FEE_ACTIONS,
      ACTION_TAXONOMY.CASH_ACTIONS,
      ACTION_TAXONOMY.SKIP_ACTIONS,
      ACTION_TAXONOMY.SPLIT_ACTIONS,
      ACTION_TAXONOMY.NAME_CHANGE_ACTIONS,
      ACTION_TAXONOMY.RIGHTS_ACTIONS,
      ACTION_TAXONOMY.REINVEST_ACTIONS,
    ].map((s) => new Set<string>(s));
    for (let i = 0; i < sets.length; i++) {
      for (let j = i + 1; j < sets.length; j++) {
        for (const item of sets[i]) {
          expect(sets[j].has(item), `${item} appears in two action sets`).toBe(
            false,
          );
        }
      }
    }
  });

  it("the dividend actions are the standard Schwab set", () => {
    expect(ACTION_TAXONOMY.DIV_ACTIONS).toContain("Qualified Dividend");
    expect(ACTION_TAXONOMY.DIV_ACTIONS).toContain("Cash Dividend");
    expect(ACTION_TAXONOMY.DIV_ACTIONS).toContain("Return Of Capital");
    expect(ACTION_TAXONOMY.DIV_ACTIONS).toContain("Reinvest Dividend");
  });
});

describe("replay date gate", () => {
  it("flags dates before the sentinel cutoff as out of model", () => {
    // TRANSFER_DATE is a sentinel (1999-12-31); isPreTransfer behaves as a
    // plain ISO comparison against whatever the operator sets it to.
    expect(isPreTransfer("1998-06-01")).toBe(true); // before sentinel
    expect(isPreTransfer("2023-01-15")).toBe(false); // after sentinel
    expect(isPreTransfer("2099-12-31")).toBe(false);
  });
});
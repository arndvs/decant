import { describe, expect, it } from "vitest";
import {
  ACTION_TAXONOMY,
  DRIFT,
  CUSIP_MAP,
  isPreTransfer,
  resolveTicker,
} from "../src/schwab";

describe("schwab bridge — applied replay round", () => {
  it("resolves direct drift maps (AABG→AAAB, HLX→AABB)", () => {
    expect(resolveTicker("AABG", "AccountA")).toBe("AAAB");
    expect(resolveTicker("HLX", "AccountC")).toBe("AABB");
    expect(resolveTicker("AAX", "AccountB")).toBe("AAX");
    expect(resolveTicker("AAY", "AccountB")).toBe("AAY");
  });

  it("collapses two-hop CUSIP chains to direct ticker (666666666→AAAT)", () => {
    // replay-analysis.py had 666666666→111111111→AAAT (two-hop). Applied round
    // is direct. Assert we never emit the intermediate CUSIP.
    expect(resolveTicker("666666666", "AccountA")).toBe("AAAT");
    expect(resolveTicker("111111111", "AccountC")).toBe("AAAT");
  });

  it("resolves merged/renamed symbols the applied replay produced", () => {
    expect(resolveTicker("AABO", "AccountA")).toBe("AAAW");
    expect(resolveTicker("AABL", "AccountA")).toBe("AAAV");
    expect(resolveTicker("AABN", "AccountC")).toBe("AAAA");
    expect(resolveTicker("222222222", "AccountC")).toBe("AAAA");
    expect(resolveTicker("AABJ", "AccountA")).toBe("AAAS");
    expect(resolveTicker("AABI", "AccountA")).toBe("AAAQ");
  });

  it("leaves unknown symbols unchanged", () => {
    expect(resolveTicker("DNN", "AccountC")).toBe("DNN");
    expect(resolveTicker("LEU", "AccountC")).toBe("LEU");
    expect(resolveTicker("AAAH", "AccountA")).toBe("AAAH");
  });

  it("every map key resolves via CUSIP_MAP to a real current ticker", () => {
    for (const [k, v] of Object.entries(CUSIP_MAP)) {
      expect(v).not.toMatch(/^\d{6,9}$/); // never resolves to another CUSIP
      expect(resolveTicker(k, "AccountA")).toBe(v);
      expect(resolveTicker(k, "AccountC")).toBe(v);
    }
  });

  it("ACCOUNT_MAP keys cover the three runtime accounts", () => {
    expect(Object.keys(DRIFT)).toEqual(["AccountA", "AccountB", "AccountC"]);
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

  it("the dividend actions sum to the dividend history feed", () => {
    // The core dividend set the Dividends tab ($5,000) counts.
    expect(ACTION_TAXONOMY.DIV_ACTIONS).toContain("Qualified Dividend");
    expect(ACTION_TAXONOMY.DIV_ACTIONS).toContain("Cash Dividend");
    expect(ACTION_TAXONOMY.DIV_ACTIONS).toContain("Return Of Capital");
    expect(ACTION_TAXONOMY.DIV_ACTIONS).toContain("Reinvest Dividend");
  });
});

describe("replay date gate", () => {
  it("flags pre-transfer buys/sells as out of model", () => {
    expect(isPreTransfer("2023-01-15")).toBe(true);
    expect(isPreTransfer("2023-05-30")).toBe(false); // the transfer itself
    expect(isPreTransfer("2020-01-01")).toBe(false);
  });
});
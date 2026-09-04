import { describe, expect, it } from "vitest";
import { clamp, cn } from "@/lib/utils";

describe("utils", () => {
  it("clamp bounds a value", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it("cn merges tailwind classes", () => {
    expect(cn("a", "b")).toBe("a b");
    expect(cn("px-1", "px-2")).toBe("px-2");
  });
});
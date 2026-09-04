export { cn } from "cn";

/** Inclusive clamp helper (from saas-starter's utils/math). */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

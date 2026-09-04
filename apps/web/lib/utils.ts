import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Inclusive clamp helper (from saas-starter's utils/math). */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
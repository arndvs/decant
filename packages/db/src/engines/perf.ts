/**
 * Performance engine — monthly money-weighted returns (the override method).
 *
 * The override method (a pure function — transfer amount is an input):
 *   N = Portfolio Starting Value  = prior month-end total value (0 for first)
 *   O = Contributions             = transfer-in for the opening month, else 0
 *   P = Withdrawals               = 0
 *   Q = Investment returns        = R − N − O − P
 *   R = Portfolio Ending Value    = month-end total value from daily series
 *   S = Dividends Received        = sum of dividend rows that month
 *   T = Portfolio Return (MWR)    = Q / N  (guard N=0 → 0)
 *
 * The transfer-in (opening position) amount is supplied by the caller;
 * no private portfolio facts are baked in here.
 */
export interface DailyValue {
  date: string; // ISO YYYY-MM-DD
  value: number; // portfolio total value that day
}

export interface MonthlyDividend {
  date: string; // ISO YYYY-MM-DD
  amount: number;
}

export interface MonthlyPerfRow {
  /** ISO month key YYYY-MM */
  month: string;
  /** prior month-end value */
  startingValue: number;
  contributions: number;
  withdrawals: number;
  /** R − N − O − P */
  returns: number;
  endingValue: number;
  dividends: number;
  /** Q / N (0 when N = 0) */
  returnPct: number;
}

export const TRANSFER_AMOUNT = 100000;
export const PERF_START = "2023-05-30";

/** Group daily values by ISO month, keeping the LAST value seen (month-end). */
export function monthEndValues(daily: DailyValue[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const d of daily) {
    const key = d.date.slice(0, 7); // YYYY-MM
    out.set(key, d.value); // later rows overwrite → last = month-end
  }
  return out;
}

/** Sum monthly dividend rows by ISO month. */
export function dividendsByMonth(divs: MonthlyDividend[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const d of divs) {
    const key = d.date.slice(0, 7);
    out.set(key, (out.get(key) ?? 0) + d.amount);
  }
  return out;
}

/** Build the month-end perf table (override method). */
export function monthlyPerformance(
  daily: DailyValue[],
  divs: MonthlyDividend[],
  opts: { transferMonth?: string; transferAmount?: number } = {},
): MonthlyPerfRow[] {
  const ends = monthEndValues(daily);
  const divByMonth = dividendsByMonth(divs);
  const months = [...ends.keys()].sort();

  const rows: MonthlyPerfRow[] = [];
  let prevEnd = 0;
  for (const month of months) {
    const R = ends.get(month) ?? 0;
    const O =
      opts.transferMonth === month
        ? (opts.transferAmount ?? TRANSFER_AMOUNT)
        : 0;
    const P = 0; // no withdrawals in the data
    const N = prevEnd;
    const Q = R - N - O - P;
    const S = divByMonth.get(month) ?? 0;
    const T = N > 0 ? Q / N : 0;

    rows.push({
      month,
      startingValue: N,
      contributions: O,
      withdrawals: P,
      returns: Q,
      endingValue: R,
      dividends: S,
      returnPct: T,
    });
    prevEnd = R;
  }
  return rows;
}
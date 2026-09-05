/** Decant shared error codes + readable messages. Pattern from Launch's contracts/errors.ts */
export type ErrorCode =
  | "INGEST_PARSE"
  | "SYMBOL_NOT_FOUND"
  | "ACCOUNT_NOT_FOUND"
  | "DUPLICATE_TRADE"
  | "ACB_NEGATIVE"
  | "PRICE_UNAVAILABLE"
  | "REBALANCE_TARGETS_NOT_100"
  | "UNKNOWN";

export const ERRORS: Record<ErrorCode, { message: string; actionable?: string }> = {
  INGEST_PARSE: { message: "Failed to parse portfolio data", actionable: "Check the XML/CSV format and re-run ingest." },
  SYMBOL_NOT_FOUND: { message: "Symbol not found in the ledger", actionable: "Verify the ticker exists in the trade log." },
  ACCOUNT_NOT_FOUND: { message: "Account not found", actionable: "Use a valid configured account name." },
  DUPLICATE_TRADE: { message: "Duplicate trade detected", actionable: "Review the ingests for an overlapping date/symbol." },
  ACB_NEGATIVE: { message: "Adjusted cost base went negative", actionable: "Check the sell exceeds the held quantity." },
  PRICE_UNAVAILABLE: { message: "Price unavailable", actionable: "Add a manual price for this OTC ticker." },
  REBALANCE_TARGETS_NOT_100: { message: "Rebalance targets must sum to 100%", actionable: "Fix TARGET_ALLOCATION in packages/config." },
  UNKNOWN: { message: "Unexpected error", actionable: "Open an issue with the traceback." },
};

export class DecantError extends Error {
  code: ErrorCode;
  details?: unknown;
  constructor(code: ErrorCode, details?: unknown) {
    super(ERRORS[code].message);
    this.name = "DecantError";
    this.code = code;
    this.details = details;
  }
  get actionable(): string | undefined {
    return ERRORS[this.code]?.actionable;
  }
}
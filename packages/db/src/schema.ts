import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, index, uniqueIndex } from "drizzle-orm/sqlite-core";

/** Investment accounts (mirror of Sheet Setup!B39:B41). */
export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  type: text("type").notNull().default("taxable"), // taxable | ira | inherited_ira
  /** For inherited IRAs: the year the account must be emptied. */
  deadlineYear: integer("deadline_year"),
});

/** One trade row (Buy/Sell/Dividend reinvest/split pair). Mirrors Trade Log. */
export const trades = sqliteTable(
  "trades",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull(), // ISO YYYY-MM-DD
    type: text("type").notNull(), // Buy | Sell | Dividend | ROC | Split
    symbol: text("symbol").notNull(),
    accountId: integer("account_id").notNull().references(() => accounts.id),
    quantity: real("quantity").notNull().default(0), // POSITIVE for both buy & sell (sheet convention)
    price: real("price").notNull().default(0),
    amount: real("amount").notNull().default(0), // total $
    fees: real("fees").notNull().default(0),
    /** True when this is the sell-leg of a merger/reverse-split (NOT a real sale). */
    conversionLeg: integer("conversion_leg", { mode: "boolean" }).notNull().default(false),
    /** For transfers-in: the cost basis carried in. */
    costBasis: real("cost_basis"),
    description: text("description"),
  },
  (t) => [
    index("trades_symbol_date").on(t.symbol, t.date),
    index("trades_account").on(t.accountId),
  ],
);

/** Dividend payments (also derivable from trades-type Dividend, but kept for yield queries). */
export const dividends = sqliteTable(
  "dividends",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull(),
    symbol: text("symbol").notNull(),
    accountId: integer("account_id").notNull().references(() => accounts.id),
    amount: real("amount").notNull(),
  },
  (t) => [index("div_date").on(t.date), index("div_symbol").on(t.symbol)],
);

/** Daily prices (yfinance + manual OTC). Symbol+date unique. */
export const prices = sqliteTable(
  "prices",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    symbol: text("symbol").notNull(),
    date: text("date").notNull(),
    price: real("price").notNull(),
    source: text("source").notNull().default("yfinance"), // yfinance | manual | schwab
  },
  (t) => [uniqueIndex("price_sym_date").on(t.symbol, t.date)],
);

/** Holdings snapshot — the latest computed position (qty, acb, mv) per symbol+account. */
export const holdings = sqliteTable(
  "holdings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    symbol: text("symbol").notNull(),
    accountId: integer("account_id").notNull().references(() => accounts.id),
    category: text("category").notNull(),
    quantity: real("quantity").notNull().default(0),
    acbTotal: real("acb_total").notNull().default(0),
    acbPerShare: real("acb_per_share").notNull().default(0),
    marketValue: real("market_value").notNull().default(0),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [uniqueIndex("holding_sym_acct").on(t.symbol, t.accountId)],
);

/** The inherited-IRA sort facility: per-symbol decision + sequencing. */
export const iraPlan = sqliteTable("ira_plan", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  symbol: text("symbol").notNull(),
  /** How the holding leaves the IRA. */
  decision: text("decision").notNull(), // sell | distribute
  /** Expected-upside ordering — lower = leave first. */
  sequence: integer("sequence"),
  /** Notes: "thesis broken", "cap exceeded", "tranche across years", etc. */
  note: text("note"),
});

/** Rebalance targets — overrides package config on a per-symbol/category basis (future). */
export const targets = sqliteTable("targets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category: text("category").notNull().unique(),
  targetPct: real("target_pct").notNull(),
});

export type Account = typeof accounts.$inferSelect;
export type Trade = typeof trades.$inferSelect;
export type Dividend = typeof dividends.$inferSelect;
export type Price = typeof prices.$inferSelect;
export type Holding = typeof holdings.$inferSelect;
export type IraPlan = typeof iraPlan.$inferSelect;
export type Target = typeof targets.$inferSelect;
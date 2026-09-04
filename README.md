# Decant

Local-first portfolio tracking. The ledger, the line, and the plan.

**Decant** helps you track a portfolio moving through time toward a deadline, across tax regimes. Lot-level accounting (ACB), realized gains, dividends, and rebalancing — with an inherited-IRA "decant" view for distributing assets in kind before 2031.

> *Decant your inherited IRA into a taxable account before 2031.*

## Stack

- **Next.js 16** + **React 19** + **Tailwind 4** + **shadcn/ui**
- **Drizzle** ORM over **SQLite** (local-first, file-backed)
- **Recharts** (via shadcn charts)
- **Schwab Trader API via MCP** (live quotes/positions; optional)

## Layout

```
apps/
  web/          Next.js app (UI + routes)
packages/
  config/       env validation, brand, targets
  db/           Drizzle schema + migrations (SQLite)
  contracts/    shared types, error registry
```

## Getting started

```bash
pnpm install
pnpm db:migrate       # create SQLite schema
pnpm ingest           # load XML/CSV portfolio data
pnpm dev              # start web
```

## Engines

Ported from the verified spreadsheet calc layer:

- **ACB** — running average cost basis per lot
- **Realized gains** — with conversion-leg exclusion (mergers/splits are not sales)
- **Dividends** — by year, by account, yield
- **Monthly performance** — from historical totals
- **Rebalance** — whole-portfolio category weights vs targets; IRA sort facility

The Google Sheets tracker is the **QA oracle**: every engine reconciles against its verified numbers.
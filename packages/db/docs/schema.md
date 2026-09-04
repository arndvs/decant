# Decant — Schema v2 (Lot-Level)

> The authoritative data model for Decant. Supersedes the 7-table Sketch (Slice 2 v1)
> and v1 of this doc. Lot accounting is the product's differentiator — not a veneer.

## Design rules

1. **`transactions` is APPEND-ONLY.** Corrections are new rows pointing at what they supersede (`supersedes_id`), never edits.
2. **Lots are the unit of tax truth.** Positions are *derived* by projecting transactions → lots → holdings. Never stored.
3. **Every price knows its source and staleness.** No frozen numbers that look live.
4. **An in-kind distribution is THREE facts** — see the in-kind section. The single most expensive bug is carrying IRA basis across (it understates future capital gains forever).
5. **ACB is a DERIVED VIEW over open lots** (weighted average), kept only as a reconciliation fixture to the spreadsheet — not a stored truth.

---

## Tables

### accounts
| col | notes |
|---|---|
| id | PK |
| schwab_hash | UNIQUE — from `/trader/v1/accounts/accountNumbers` |
| display_name | e.g. "AccountC" |
| account_type | `inherited_ira` \| `traditional_ira` \| `roth_ira` \| `taxable` |
| gains_taxable | 0 for IRAs — trims are free |
| losses_deductible | 0 for IRAs — no harvesting |
| wash_sale_applies | |
| must_empty_by | DATE, NULL if no deadline (2031 for AccountC) |
| rmd_required | default 0 |

### securities
| col | notes |
|---|---|
| id | PK |
| ticker | UNIQUE — as traded at Schwab |
| name | |
| home_exchange / home_ticker / home_currency | **spike-dependent.** Populated only if the pricing resolver needs them. Dead columns if spike says Schwab covers OTC. |
| sector / thesis_tag | sector drives caps; thesis drives correlation (SMR = `uranium_nuclear` sector, `ai_datacenter_power` thesis) |
| is_otc / is_mlp / is_prerevenue | UBTI risk in IRA; pre-revenue ranks distribution order |
| liquidity_tier | `deep` \| `thin` \| NULL |

### transactions — append-only event log (source of truth)
| col | notes |
|---|---|
| id | PK |
| schwab_id | UNIQUE — dedupe on re-import |
| trade_date / settle_date | |
| account_id / security_id | FKs |
| txn_type | `buy` \| `sell` \| `dividend` \| `drip` \| `split` \| `return_of_capital` \| `fee` \| `interest` \| `distribution_in_kind` \| `transfer` |
| quantity / price / gross_amount / fees / split_ratio | |
| supersedes_id | → transactions.id (corrections) |
| source | `schwab_api` \| `spreadsheet_migration` \| `manual` |
| notes | |

**Partial unique on the natural key** `(account_id, security_id, trade_date, txn_type, quantity, gross_amount)` to harden manual/spreadsheet path (schwab_id covers the API path).

### lots — one row per acquired parcel
| col | notes |
|---|---|
| id | PK |
| account_id / security_id | |
| acquired_date | starts the holding-period clock |
| original_quantity / open_quantity | open_quantity is always the truth |
| cost_basis_per_share | |
| opening_txn_id | → transactions.id |
| **parent_lot_id** | → lots.id. **FIX**: partial sells SPLIT a lot — closed child + remaining open child. v1 described this but didn't model it. |
| origin | `purchase` \| `drip` \| `split` \| `in_kind` \| `migration` (+ `transfer` for account-to-account) |
| source_lot_id | set when origin=`in_kind` — links taxable lot back to the IRA lot |
| **basis_is_estimated** | TRUE when basis came from the sheet's ACB (cannot be reversed into lots). **NEVER harvest against an estimated lot.** |

`CREATE INDEX ... WHERE open_quantity > 0` — partial-index on open lots.

### lot_closures
| col | notes |
|---|---|
| id | PK |
| lot_id / closing_txn_id / close_date | |
| quantity | **FIX**: must be ≤ open_quantity (partial closures) — not "one closure per lot" |
| proceeds_per_share | |
| **basis_per_share** | **FIX (v2)**: the basis slice actually closed. Gain = qty × (proceeds − basis). v1 had one `realized_gain` per lot, broken for partial sells. |
| realized_gain | computed |
| is_long_term | close_date − acquired_date > 1yr |
| wash_sale_disallowed / replacement_lot_id | nonzero only on deferred wash losses |
| **basis_is_estimated** | **FIX**: propagates from the source lot (a closure of an estimated lot is estimated) |

### lot_transfers — the in-kind distribution (REPLACES gain-zero closures)
| col | notes |
|---|---|
| id | PK |
| from_lot_id / to_lot_id | source (IRA) lot → new taxable lot |
| txn_id | → transactions.id (the `distribution_in_kind` row) |
| transfer_date / quantity | |
| fmv_per_share | the new cost basis in taxable |

**Why:** a distribution is a **transfer**, not a closure-with-gain-0. The IRA lot's open_quantity decrements (or closes), a NEW taxable lot opens with `fmv_per_share` basis + fresh `acquired_date` (clock restarts → short-term for a year). The engine must NEVER compute a realized gain in the IRA for this (IRAs don't recognize gains — if it does, it's wrong and corrupts the tax math).

### ordinary_income_events
| col | notes |
|---|---|
| id | PK |
| txn_id | → transactions.id |
| tax_year / account_id | |
| **security_id** | **FIX v2**: v1 missed it — needed to report "what was distributed" |
| fmv_amount | taxable = FMV at transfer |
| withholding | |
| satisfies_rmd | default 1 |

### prices
| col | notes |
|---|---|
| security_id / price_date | PK (composite) |
| close_price / currency / fx_rate_to_usd | FX only if spike needs it |
| source | `schwab` \| `home_listing` \| `manual` |
| fetched_at | |
| is_stale | no trade that day |
| bid_ask_spread | flags bad OTC quotes (>5% = not usable for a rebalance buy/sell) |
| **last_trade_date (on securities)** | tells "no trade that day" from "never trades" |

### cash_balances — FIX (v1 missing)
| col | notes |
|---|---|
| id | PK |
| account_id | |
| as_of_date | |
| cash_amount | |
| source | schwab_api \| manual |
| is_cash_buffer | flag for the 2-yr tax-bill buffer (~$11.5K → 0 by 2030) |

### allocation_targets / position_caps
| col | notes |
|---|---|
| allocation_targets | sector PK, target_pct, sector_cap_pct, effective_date |
| position_caps | scope PK ('default' or ticker), max_pct (0.08 household-wide) |

### tax_years
| col | notes |
|---|---|
| year | PK |
| filing_status / marginal_ordinary / ltcg_rate / bracket_headroom | bracket_headroom from preparer — drives IRA tranche sizing |
| is_estimate | default 1 |

### ira_tranche_plan — FIX (v1 missing)
| col | notes |
|---|---|
| id | PK |
| tax_year | which year's distribution |
| from_lot_id | lot being pulled |
| target_shares | "20% of the Centrus position," not dollars |
| expected_fmv | for bracket planning |
| status | planned \| executed |

### benchmark_periods — FIX (v1 missing; monthly-perf engine has no store)
| col | notes |
|---|---|
| id | PK |
| period_end | month end |
| account_id | (or NULL = portfolio-wide) |
| portfolio_value / cash / invested | |
| benchmark_total_return | S&P 500 (or custom) |

---

## ACB as a derived view (the reconciliation bridge)

```sql
-- ACB/share per account+security = weighted avg of OPEN lot basis
SELECT account_id, security_id,
       SUM(cost_basis_per_share * open_quantity) / SUM(open_quantity) AS acb_per_share
FROM lots
WHERE open_quantity > 0
GROUP BY account_id, security_id;
```

Keeps the sheet's $25,000 ACB gate + the +$150.00 realized gate as *proof the port is correct*, then drop the view once the lot engine is trusted.

---

## Migration

1. **Import from Schwab `/transactions`** (their cost-basis lots — what they report to the IRS), **not** the spreadsheet.
2. **XMLs become the reconciliation fixture**: import Schwab → assert quantities + MVs match XML-derived totals per account.
3. Where Schwab history doesn't reach → `lots.basis_is_estimated = 1`, flagged, never silent.
4. The sheet is the **QA oracle**, not the source.
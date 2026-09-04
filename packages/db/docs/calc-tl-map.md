# Calc Trade Log (Calc TL) — Complete Column Map (verified 2020-01-02)

> **The authoritative reference for the ported engines.** Built from LIVE formula dumps
> (probe-calc-live.py / deep-explore-calc.py, 2020-01-02) + the applied STRICT X formula.
> Supersedes the fragmentary notes in the scratch scripts.
>
> **Key structural fact:** Calc TL reads the Trade Log via `ARRAYFORMULA('Trade Log'!B6:J)`.
> Column A is a blank row label; **data starts at column B**. Headers live at row 5; live data
> ~rows 6–828 (reserve to 4000). The sheet's hidden calc layer — "don't touch".

## Header row (row 5) — exact

Letters `A`..`i` (where `[ \ ] ^ _ \` a b c d e f g h i` = column letters after Z, i.e. AA-AL):

| Letter | Header | Meaning |
|---|---|---|
| B | Date (MM-DD-YYYY) | serial date |
| C | Transaction Type | Buy/Sell/Dividend/ROC/… |
| D | Stock / ETF Symbol | ticker (canonicalized by ingestor) |
| E | Quantity of Units | **positive for both** (sells negated internally) |
| F | Amount per unit | |
| G | Total Amount (before trading fees) | Buy: cost; Sell: proceeds |
| H | Trading Fees | |
| I | **Investment Account** | ← THE only per-account dimension |
| J | Split Ratio (new shares per old share) | Trade Log only (replay writes it); Calc TL J unused by formulas |
| K | *(spare)* | not referenced |
| L | Currency | `=index(Setup!$C$52:$C$301, match(D, Setup!$B$52:$B$301))` — #N/A on orphans |
| M | Investment Category | `=index(Setup!$D$52:$D$301, match(D, Setup!$B$52:$B$301))` — the category key |
| N | Total # of Shares - Pre Trx | `=SUMIFS($AA,$B,"<"&B, C,"Buy", D, D6, I, $C$2270) − SUMIFS(...Sell)` |
| O | Total # of Shares - Post Trx | `=abs(if($C$2270="*", if(C="Buy",AA, if(C="Sell",AA*-1,0))+N, …))` |
| P | ACB - Pre Trx | `=SUMIFS($Q, $B,"<"&B, D,D6, I,$C$2270)` (pre-date ACB) |
| Q | Impact on ACB | `=if($C$2270="*", if(C="Buy",G+H, if(C="Sell",AA*S*-1, if(C="Return of Capital",G*-1, …))), …)` |
| R | ACB - Post Trx | `=P+Q` |
| S | ACB per share - Pre Trx | `=iferror(P/N, 0)` |
| T | ACB per share - Post Trx | `=iferror(R/O, 0)` |
| U | Sale Price - Total $ (Local Currency) | `=if(B="","",if(OR($C$2270=$I, $C$2270="*"), if(C="Sell", G-H, 0), 0))` — **$0 for non-sells** |
| V | Realized Gain - Total $ (Local Currency) | `=U − S×AG` (pre-IFERROR; **not summed** — X is) |
| W | Sale Price - Total $ (Common Currency) | `=U×AJ` — Realized Gains F feed |
| X | **Realized Gain - Total $ (Common Currency)** | **STRICT (live):** `=if(B="","",if(OR($C$2270=$I,$C$2270="*"),if(AND(C="Sell",U>0,AP>0),IFERROR(W−(AP×AG),0),0),0))` — RG G feed |
| Y | Last Transaction for Symbol on Date? | `"Y"` marker — Holdings `index(Calc TL R, match)` anchor |
| Z | Split Ratio (as of user input date) | |
| [ | Share Quantity (adjusted for split ratio) - master user input date | = `Z×E` (the `AA` in formula letters) |
| \ | Split Ratio (as of return start date) | |
| ] | Share Quantity (adjusted) - Return Start Date | |
| ^ | Split Ratio (as of return end date) | |
| _ | Share Quantity (adjusted) - Return End Date | |
| ` | Split Ratio (as of today) | |
| a | Share Quantity (adjusted) - as of today | |
| b | Buy / Sell / Dividend / ROC Count (within return date range) | |
| c | FX Lookup Code | |
| d | **FX Rate (at date of trade)** | the `AJ` in formula letters — W = U×AJ |
| e | Trade $ Amount ex. Fees (adjusted currency) | |
| f | Trade $ Amount incl. Fees (adjusted currency) | |
| g | ACB - pre trx (adjusted currency) | |
| h | Impact to ACB (adjusted currency) | |
| i | ACB - Post Trx (adjusted currency) | |

**Critical alias note:** In formula text, `AA` = the header `[` (master qty), `AG` = the split-adjusted price factor `AF×E`, `AJ` = FX rate (header `d`), `AK` = the currency-converted value, `AP` = ACB/shr = `AM/N`, `AO` = perf-end value. **The ported engines must reference the LETTERS as the formula layer does (AA/AG/AJ/AP), not the header aliases.**

## Column semantics for the port

| Col (formula letters) | Port meaning |
|---|---|
| **N / O** | lot running qty (pre/post). **O (post) is the per-account current qty** — the only per-account qty source in the sheet. |
| **P / Q / R** | ACB running (pre / impact / post). R feeds Holdings K (`index(Calc TL R, match(Y))`). |
| **S / T** | ACB/share before/after. |
| **U / W** | sale proceeds local / common (FX). W = U×AJ. |
| **V / X** | realized gain local / common. **X is the STRICT-totalized one** (RG G = ΣX). V holds 4 residual #N/A (cosmetic). |
| **Y** | last-(date,symbol) marker → Holdings anchor. |
| **AA** | split/qty-adjusted qty (the header `[`). |
| **AC / AE** | perf-start qty multipliers → Holdings AD / AJ. |
| **AG** | split-adjusted price factor (= `AF×E`) — used in V and X. |
| **AJ** | FX rate (header `d`). |
| **AK** | currency-converted value → Holdings `sumifs(Calc TL AK)` — the Dividends USD feed. |
| **AO** | perf-end value → Holdings U (perf-end MV). |
| **AP** | ACB/share = `AM/N` — the X STRICT gate `AP>0`. |

## The account selector — `Calculations!$C$2270`

Every N/O/P/U/W/X row gates on `OR($C$2270=$I_row, $C$2270="*")`:
- `"*"` → all accounts (combined)
- an account name → filter to that account only

The Dashboard shows this as a dropdown (data validation). `C2272` mirrors the label
("All Accounts" / "Filtering on <acct> Only"). This is the **only** account-dimension switch.

## Consumers

| Downstream | Column | Mechanism |
|---|---|---|
| Realized Gains F (Sale $) | `Σ W` | SUMIFS over W by account/category/currency × date window |
| Realized Gains G (Cost $) | `Σ X` | E = F−G |
| Holdings E (qty) | `Σ AA` buy − `Σ AA` sell (per D) | split-adj qty |
| Holdings K (cost basis) | `index(Calc TL R, match(AT, sym))` | last row's R |
| Holdings O (dividends) | `Σ Calc TL G, "Dividend", sym` | local-currency dividends |
| Holdings Z (dividends USD) | `Σ Calc TL AK, "Dividend", sym` | USD dividends (the live Dividend feed) |
| Holdings U (perf-end MV) | `index(Calc TL AO, match(AT,sym))` | perf-end value |
| Holdings AD/AJ (perf-start qty) | `Σ Calc TL AC/AE` | perf-start qty |
| Holdings AX/AY/AZ (per-acct qty) | `Σ Calc TL AA, Buy−Sell, per acct` | today's per-account qty |
| Dashboard MV | `Calculations!B2231` (via Holdings) | securities MV |

## Realized Gains tab structure (verified 2020-01-02)

- **By-account block (rows 12–21 + Total row 22):** per account B (Setup!B39..), E=F−G, 
  `F=SUMIFS(Calc TL $W, I=$B12, B≥D3, B≤D4)`, `G=SUMIFS(Calc TL $X, …)`, `H=iferror(G/E,0)`.
- **By-category block (rows 29+):** reads the RG tab's OWN internal materialized columns
  (`$K$77:$K$326` = cost, `$L$77:$L$326` = sale, per `D` category) — NOT Calc TL directly.
  The RG tab projects category rows itself.
- **Window cells:** `D3` (start) + `D4` (end) on the RG tab bound every SUMIFS date range.

## Known invariants (must survive the port)

1. **Sells are positive qty**; the calc layer negates internally (O6/Q6 use `AA*-1`, E = Buy−Sell). **Never write negative sells.**
2. **Mergers/splits are Buy/Sell pairs** — E only counts Buy/Sell (not "Split").
3. **Orphan symbols** (sold-out, not in Setup) → `MATCH()` #N/A on L/M/O/Z..AG/AI → 230 error cells. A port must keep closed lots, not orphans.
4. **ACB is a running window** (P/Q/R → R), not a stored number; ACB/shr = derived.
5. **The realized-gains gate is `U>0 AND AP>0`** (sale w/ known basis), NOT "same-day buy" — conversion legs (W=0) auto-zero.

---

*Calc TL map v1 · 2020-01-02 · live-verified · source: probe-calc-live.py, deep-explore-calc.py, x-formulas-backup.json*
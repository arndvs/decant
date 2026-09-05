# Your Portfolio Holdings — Column Map (verified 2020-01-02)

> **The authoritative reference for the holdings/portfolio view + the per-account
> matrix (rebalance Slice 1).** Built from LIVE formula dump (probe-holdings-cols.py,
> Holdings!A1:BF10, 2020-01-02). The tab is a **projection** — every value derives from
> Calc TL/Setup via formula, never free-form (except manual-price col H).

## Layout

- Headers: row 6 (group labels row 4-5, total row 8, data rows 10–259).
- **3 block groups:** F=Local Currency · Q=USD Currency · AA+=Perf/Rank/Account.
- Row 8 = totals (`U,V,W,X,Y,Z,AI,AO` sums of 10:259; `AA8` = sparkline days 90).

## Columns (exact formulas, row 10 sample)

### Block 1 — In Local Currency (F..O)

| Col | Header | Formula (row 10) |
|---|---|---|
| B | Stock / ETF Ticker | `=Setup!B52` |
| C | Currency | `=Setup!C52` |
| D | Investment Category | `=Setup!D52` |
| E | Quantity of Units | `=IF($B10="","",ROUND(SUMIFS('Calc Trade Log'!$AA,$D,$B10,…Buy)−SUMIFS(…Sell),…))` |
| F | Cost Base | `=if($B10="","",iferror(K10/E10,0))` |
| G | Market Value (from Google Finance) | `=if($AU10="Y",if(Calculations!$C$2244>=today(),googlefinance($B10),…),…)` |
| H | **Market Value (MANUAL INPUT)** | manual — the OTC price entry |
| I | Unrealized Gain | `=if(OR($B10="",$E10=0),"",BX10-F10)` |
| J | Unrealized Gain - % | `=iferror(I10/F10,0)` |
| K | Cost Base | `=IFERROR(ArrayFormula(IF($B10="","",index('Calc Trade Log'!$R:$R,match(1,($AT10=…$B:$B)*($B10=…$D:$D),0)))))` — **running ACB R at last txn** |
| L | Market Value | `=$E10*BX10` |
| M | Unrealized Gain | `=L10-K10` |
| N | Unrealized Gain - % | `=iferror(M10/K10,0)` |
| O | Dividends Received | `=iferror(sumifs('Calc Trade Log'!$G:$G,C="Dividend",D=$B10),0)` |

### Block 2 — In USD Currency (Q..Z)

| Col | Header | Formula |
|---|---|---|
| Q | Price Per Unit (USD) | `=iferror(U10/E10,0)` |
| R | Market Value (USD) | `=BX10*$AB10` ← **the USD MV** |
| S | Unrealized Gain (USD) | `=R10-Q10` |
| T | Unrealized Gain - % | `=iferror(S10/Q10,0)` |
| U | Cost Base (USD) | `=IFERROR(index('Calc Trade Log'!$AO:$AO,match(1,…)))` — **perf-end ACB via AO** |
| V | Market Value (USD) | `=L10*$AB10` |
| W | % of Portfolio | `=iferror($V10/$V$8,"n/a")` |
| X | Unrealized Gain (USD) | `=V10-U10` |
| Y | Unrealized Gain - % | `=iferror(X10/U10,0)` |
| Z | Dividends (USD) | `=iferror(sumifs('Calc Trade Log'!$AK:$AK,C="Dividend",D=$B10),0)` — **the USD div feed** |

### Block 3 — Perf / Rank / Account (AA..BF)

| Col | Meaning | Formula |
|---|---|---|
| AA | **Share price trend** (sparkline) | `=IF($B10="","",SPARKLINE(GOOGLEFINANCE($B10,"price",TODAY()-$AA$8,TODAY(),"daily"),…))` — quote-less/manual-price tickers show #N/A (intentional) |
| AB | FX rate | `=IF($B10="","",INDEX(Calculations!$C$331:$G$335,match($C10,…),match(Dashboard!$C$3,…)))` |
| AD | Qty at start | `=SUMIFS('Calc Trade Log'!$AC:$AC,D=$B10,…)` (perf-start) |
| AE | GF price (start) | `=if($AU10<>"Y",if(Dashboard!$C$53>=today(),googlefinance($B10),…),…)` |
| AF | **Manual price/share (start)** | manual input block |
| AG | FX (start) | `=INDEX(Calculations!$C$349:$G$353,…)` |
| AH | split mult | `=CE10` |
| AI | MV-total (start) | `=AI: if($H$262="Yes",…,AD×AE/ AF×AG×AH)` |
| AJ | Qty at end | `=SUMIFS('Calc Trade Log'!$AE:$AE,D=$B10,…)` |
| AK | GF price (end) | perf-end price |
| AL | **Manual price/share (end)** | manual block twin of AF |
| AM | FX (end) | `=INDEX(Calculations!$C$367:$G$371,…)` |
| AN | split mult (end) | `=CF10` |
| AO | MV-total (end) | perf-end value |
| AQ | Change in MV | `=AK10-AE10` |
| AR | Change % | `=iferror(AQ10/AE10,"")` |
| AT | **Latest txn date** | `=MAXIFS('Calc Trade Log'!$B:$B,D=$B10,$B:$B,"<="&Calculations!C2244)` — the lookup anchor |
| AU | "quoted in cents?" | `=Setup!H52` |
| AV | Size rank | `=iferror(rank($V10,$V$10:$V$259,0)+COUNTIFS($V$10:V10,$V10)-1,"")` |
| **AX/AY/AZ** | **# Shares by Account** (per configured account) | `=sumifs('Calc Trade Log'!$AA,$D=$B10,C="Buy",I=acct)−sumifs(…Sell)` — **today's per-account qty** |
| BA..BF | TFSA/RRSP/RESP… template leftovers | same pattern (empty) |

## Key facts for the port

1. **The tab is combined-only** except AX:AZ (per-account **qty**, not value). Per-account **value
   does not exist** — only the proration approach (per-account qty share × Holdings MV).
2. **Manual-price storage = col H** (live) **+ AF/AL** (perf blocks). README's "H + R" is shorthand
   (R is derived from BX×AB, not manual).
3. **Dividends USD come from Calc TL `AK`** (not G) — matching the Dividends tab's SUMIFS.
4. **The user-input date** `Calculations!$C$2244` drives WHICH price block (start vs end) the
   holdings read. Dashboard `C53`/`C54` = perf start/end dates.
5. **`AT` (latest txn date)** is the match anchor for `index(Calc TL R/AO)` — cost+MV at last trade.
6. **`H$262` = "Yes"** toggles manual-price priority in the perf blocks (AI/AO).

## Cross-sheet magic cells (all in Calculations unless noted)

| Cell | Meaning |
|---|---|
| `Calculations!$C$2270` | account selector (`"*"` or acct) — gates every Calc TL row |
| `Calculations!$C$2244` | user-input as-of date (drives price start/end) |
| `Dashboard!C53/C54` | perf start/end dates (45076 / end) |
| `Calculations!$C$331:$G$335` | FX lookup matrix (live) |
| `Calculations!$C$349:$G$353` | FX lookup matrix (start) |
| `Calculations!$C$367:$G$371` | FX lookup matrix (end) |
| `Calculations!B28:B52` | combined category $ (feeds Re-Balancing) |
| `Calculations!B2231` | Dashboard securities MV |
| `Calculations!C2258:C2268` | account-value neighborhood (C2260.. = account rows) |
| `Calculations!$B$339:$B$343` | currency symbol list (FX) |

---

*Holdings map v1 · 2020-01-02 · live-verified · source: probe-holdings-cols.py (FORMULA dump)*
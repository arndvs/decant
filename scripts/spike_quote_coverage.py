#!/usr/bin/env python3
"""
Phase 0 spike: does Schwab's Market Data API quote your OTC/foreign positions?

This answers ONE question and then gets thrown away. The answer determines
whether the pricing service needs a home-listing resolver + FX layer, or not.

Usage:
    export SCHWAB_APP_KEY=...
    export SCHWAB_APP_SECRET=...
    export SCHWAB_CALLBACK_URL=https://127.0.0.1
    python spike_quote_coverage.py

Tokens are cached in ./.schwab_tokens.json. Refresh tokens die after 7 days;
when that happens the script just re-runs the browser flow.
"""

import base64
import json
import os
import sys
import time
import webbrowser
from pathlib import Path
from urllib.parse import urlparse, parse_qs

import requests

OAUTH_AUTHORIZE = "https://api.schwabapi.com/v1/oauth/authorize"
OAUTH_TOKEN = "https://api.schwabapi.com/v1/oauth/token"
MARKET_DATA = "https://api.schwabapi.com/marketdata/v1"

TOKEN_FILE = Path(".schwab_tokens.json")

# ---------------------------------------------------------------- test symbols

# Control group -- these MUST work. If they don't, the problem is auth, not coverage.
CONTROL = ["LEU", "WPM", "AAAH", "SCCO"]

# The actual question: OTC foreign ordinaries you hold.
OTC_HELD = [
    "ATHOF",  # Athabasca Oil        (TSX: ATH)   -- large, liquid at home
    "AAAG",  # Bannerman Energy     (ASX: BMN)   -- largest OTC position
    "ATUSF",  # Altius Minerals      (TSX: ALS)
    "AAAP",  # Tourmaline Oil       (TSX: TOU)
    "AAAQ",  # Paladin Energy       (ASX: PDN)
    "DYLLF",  # Deep Yellow          (ASX: DYL)
    "AAAW",  # Whitecap Resources   (TSX: WCP)
    "OBE",    # Obsidian Energy      (TSX: OBE)   -- NYSE American, control-ish
    "BIREF",  # Birchcliff Energy    (TSX: BIR)
    "AAAV",  # Surge Energy         (TSX: SGY)
    "AAAF",  # Elevate Uranium      (ASX: EL8)
    "AABE",  # Forsys Metals        (TSX: FSY)
    "TOLWF",  # Toro Energy          (ASX: TOE)
    "CFWFF",  # Calfrac Well Svcs    (TSX: CFW)
    "AAAE",  # Appia Rare Earths    (CSE: API)
    "AABF",  # Skyharbour Resources (TSXV: SYH)
    "AAAA",  # Standard Uranium     (TSXV: STND)
    "AAAR",  # Basin Uranium        (CSE: BSN)
    "AAAS",  # American Lithium     (TSXV: LI)
    "AABD",  # Reconnaissance Energy
    "SEED",   # Origin Agritech
]

# Long shot: does Schwab quote foreign primary listings directly?
# If ANY of these work it changes the resolver design substantially.
HOME_LISTINGS = ["ATH.TO", "TOU.TO", "BMN.AX", "PDN.AX", "ATH:CA", "BMN:AU"]


# ---------------------------------------------------------------------- oauth

def _basic_auth_header(key: str, secret: str) -> str:
    raw = f"{key}:{secret}".encode("utf-8")
    return "Basic " + base64.b64encode(raw).decode("utf-8")


def _save(tokens: dict) -> None:
    tokens["_obtained_at"] = time.time()
    TOKEN_FILE.write_text(json.dumps(tokens, indent=2))
    TOKEN_FILE.chmod(0o600)


def _load() -> dict | None:
    if not TOKEN_FILE.exists():
        return None
    return json.loads(TOKEN_FILE.read_text())


def browser_flow(key: str, secret: str, callback: str) -> dict:
    """Full OAuth. Needed on first run and every 7 days after."""
    url = f"{OAUTH_AUTHORIZE}?client_id={key}&redirect_uri={callback}"
    print("\nOpening browser. Log in, approve, then copy the FULL URL you land on.")
    print(f"If the browser doesn't open:\n  {url}\n")
    webbrowser.open(url)

    returned = input("Paste the full redirect URL here:\n> ").strip()

    # Parse properly. The auth code is URL-encoded and contains '@' as %40 --
    # naive string slicing on '%40' breaks when the code contains other escapes.
    qs = parse_qs(urlparse(returned).query)
    if "code" not in qs:
        sys.exit(f"No 'code' parameter found in that URL. Got keys: {list(qs)}")
    code = qs["code"][0]

    resp = requests.post(
        OAUTH_TOKEN,
        headers={
            "Authorization": _basic_auth_header(key, secret),
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": callback,
        },
        timeout=30,
    )
    if resp.status_code != 200:
        sys.exit(f"Token exchange failed [{resp.status_code}]: {resp.text[:500]}")

    tokens = resp.json()
    _save(tokens)
    print("Tokens saved to .schwab_tokens.json")
    return tokens


def refresh(key: str, secret: str, refresh_token: str) -> dict | None:
    resp = requests.post(
        OAUTH_TOKEN,
        headers={
            "Authorization": _basic_auth_header(key, secret),
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data={"grant_type": "refresh_token", "refresh_token": refresh_token},
        timeout=30,
    )
    if resp.status_code != 200:
        return None
    tokens = resp.json()
    _save(tokens)
    return tokens


def get_access_token(key: str, secret: str, callback: str) -> str:
    cached = _load()
    if cached:
        age = time.time() - cached.get("_obtained_at", 0)
        if age < 25 * 60 and "access_token" in cached:
            return cached["access_token"]
        if "refresh_token" in cached:
            refreshed = refresh(key, secret, cached["refresh_token"])
            if refreshed:
                return refreshed["access_token"]
            print("Refresh token expired (7-day limit). Re-authenticating.")
    return browser_flow(key, secret, callback)


# --------------------------------------------------------------------- quotes

def fetch_quotes(token: str, symbols: list[str]) -> dict:
    """Batch quote request. Schwab caps at 120 req/min so batching matters."""
    resp = requests.get(
        f"{MARKET_DATA}/quotes",
        headers={"Authorization": f"Bearer {token}"},
        params={"symbols": ",".join(symbols), "fields": "quote,reference"},
        timeout=30,
    )
    if resp.status_code != 200:
        print(f"  [HTTP {resp.status_code}] {resp.text[:300]}")
        return {}
    return resp.json()


def summarize(label: str, token: str, symbols: list[str]) -> tuple[int, int]:
    print(f"\n{'=' * 66}\n{label}\n{'=' * 66}")
    data = fetch_quotes(token, symbols)

    # Schwab returns an 'errors' block listing symbols it couldn't resolve.
    invalid = set()
    errors = data.get("errors", {})
    for bucket in errors.values():
        if isinstance(bucket, list):
            invalid.update(bucket)

    ok = 0
    for sym in symbols:
        entry = data.get(sym)
        if not entry or sym in invalid:
            print(f"  {sym:8s} NO QUOTE")
            continue

        q = entry.get("quote", {})
        ref = entry.get("reference", {})
        last = q.get("lastPrice") or q.get("mark") or q.get("closePrice")
        bid, ask = q.get("bidPrice"), q.get("askPrice")

        spread = ""
        if bid and ask and ask > 0:
            pct = (ask - bid) / ask * 100
            flag = "  <-- WIDE (>5%)" if pct > 5 else ""
            spread = f"  spread {pct:5.2f}%{flag}"

        desc = (ref.get("description") or "")[:28]
        exch = ref.get("exchangeName", "?")
        stale = " [STALE/NO-TRADE]" if not last else ""

        print(f"  {sym:8s} {str(last):>10s}  {exch:12s} {desc:30s}{spread}{stale}")
        if last:
            ok += 1

    print(f"\n  -> {ok}/{len(symbols)} priced")
    return ok, len(symbols)


def main() -> None:
    key = os.environ.get("SCHWAB_APP_KEY")
    secret = os.environ.get("SCHWAB_APP_SECRET")
    callback = os.environ.get("SCHWAB_CALLBACK_URL", "https://127.0.0.1")

    if not key or not secret:
        sys.exit("Set SCHWAB_APP_KEY and SCHWAB_APP_SECRET first.")

    token = get_access_token(key, secret, callback)

    c_ok, c_n = summarize("CONTROL (must all work, else it's an auth problem)",
                          token, CONTROL)
    if c_ok < c_n:
        print("\n!! Control group failed. Fix auth before trusting anything below.")

    o_ok, o_n = summarize("OTC HELD (the actual question)", token, OTC_HELD)
    h_ok, h_n = summarize("HOME LISTINGS (long shot)", token, HOME_LISTINGS)

    print(f"\n{'=' * 66}\nVERDICT\n{'=' * 66}")
    print(f"  Control:       {c_ok}/{c_n}")
    print(f"  OTC held:      {o_ok}/{o_n}")
    print(f"  Home listings: {h_ok}/{h_n}")
    print()
    if o_ok == o_n:
        print("  Schwab covers everything. Skip the resolver + FX layer entirely.")
        print("  Pricing service = one Schwab client. Build Phase 1 next.")
    elif o_ok == 0:
        print("  No OTC coverage. You need a second price source for all of them.")
        print("  Design the resolver (OTC ticker -> home listing -> FX) now.")
    else:
        print(f"  Partial: {o_n - o_ok} symbols need a fallback source.")
        print("  Build the manual-override table with staleness flags, and")
        print("  a resolver only for the gaps. Schwab handles the rest.")
    print()


if __name__ == "__main__":
    main()
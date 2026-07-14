<h1 align="center">Claims</h1>

<p align="center">
  <b>A public ledger of falsifiable claims — each one re-proven every night by
  deterministic, zero-token replay.</b>
</p>

<p align="center">
  <a href="https://github.com/LeonTing1010/tap-skills/actions/workflows/reverify.yml"><img src="https://img.shields.io/github/actions/workflow/status/LeonTing1010/tap-skills/reverify.yml?style=flat-square&label=nightly%20reverify" alt="nightly reverify"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/LeonTing1010/tap-skills?style=flat-square" alt="License"></a>
</p>

---

Every claim here is:

- **dated and falsifiable** — it states exactly what would prove it wrong;
- **machine-verified nightly** — a [Tap](https://github.com/LeonTing1010/tap) plan
  (plain JSON, no code) re-runs against the live web at **zero LLM tokens**, so this
  ledger can afford what no hand-curated list can: proving itself alive every night;
- **verifiable by you in minutes** — one `curl` + one `npx`, no login, no browser,
  and you can read the entire plan before running it.

A claim that drifts flips to 🟡 in the table below — automatically, publicly.
**If a row says 🟢, a machine checked it last night. Nobody's memory is involved.**

## Ledger

<!--LEDGER-->
| Claim | Published | Last verified | Status |
|---|---|---|---|
| [GitHub Trending has no official API](claims/2026-07-11-github-trending-has-no-api/CLAIM.md) | 2026-07-11 | 2026-07-14 | 🟢 verified |
<!--/LEDGER-->

## Verify a claim yourself

Each `CLAIM.md` carries its own two-line verification. The general shape:

```bash
mkdir -p ~/.tap/plans/<site>
curl -fsSL https://raw.githubusercontent.com/LeonTing1010/tap-skills/main/claims/<claim>/plan.json \
  -o ~/.tap/plans/<site>/<name>.plan.json
npx -y @taprun/cli <site>/<name>
```

The plan is bare JSON with a closed 18-op vocabulary — read it first, then run it.
Replay is deterministic: you get the same verification the nightly CI gets.

## Refute a claim

[Open an issue](https://github.com/LeonTing1010/tap-skills/issues/new) with your run
output. A successful refutation flips the claim publicly. This ledger only works if
being wrong is louder than being right — refutations are welcome.

## Rules of this repo

1. **No claim without a machine-re-runnable proof.** Judgment enters as a dated,
   falsifiable statement or it doesn't enter.
2. **Receipts, never content.** Nightly receipts record `{state, outcome, counts,
   plan_hash}` — verification metadata only. Scraped page content is never stored
   or republished.
3. **Only CI-verifiable claims.** Nothing here requires a login session; every claim
   runs on a bare GitHub Actions runner exactly as it runs on your machine.
4. **No catalog.** This repo is not a skills directory. The 140-skill v1 catalog is
   preserved untouched on the [`v1-archive`](https://github.com/LeonTing1010/tap-skills/tree/v1-archive)
   branch; plans an agent needs are forged on demand by
   [`tap capture`](https://github.com/LeonTing1010/tap) — a pre-built catalog only rots.

---

<p align="center">
  <sub>Built on <a href="https://github.com/LeonTing1010/tap">Tap</a> — capture a browser
  task once, replay it forever at zero LLM tokens, local-first.</sub>
</p>

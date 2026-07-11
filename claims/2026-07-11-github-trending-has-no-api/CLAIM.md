# Claim: GitHub Trending has no official API

**Published:** 2026-07-11 · **Author:** [@LeonTing1010](https://github.com/LeonTing1010) · **Status:** see [ledger](../../README.md) — re-verified nightly

## The claim

GitHub's REST API has never offered a Trending endpoint, and still doesn't.
The machine-checkable form of this claim:

1. `https://api.github.com/` — GitHub's own machine-readable **index of every REST
   endpoint template** — contains no `trending` entry.
2. Therefore the HTML page `https://github.com/trending` is the **only first-party
   source**, and a deterministic DOM extraction against it is the correct (and only)
   automation layer.

**Falsifiable:** the day GitHub ships a trending endpoint, op 1's `expect` gate fails
the nightly run loudly and this claim flips to refuted in the ledger. That is the point.

## Why this matters (the judgment)

- People ask for a "GitHub trending API" constantly; the third-party projects that
  answer it are all scrapers, and many are dead. The durable answer is not a forum
  post that rots — it's a **proof that re-establishes itself every night**.
- Source Ladder discipline: automation should be authored at the API layer (L1) and
  only downgrade to DOM (L4) on **proven** failure. This claim *is* the documented
  proof that forces L4 for trending — the downgrade reason, published with receipts,
  instead of buried in a code comment.

## Verify it yourself (~2 minutes, no login, no browser)

```bash
mkdir -p ~/.tap/plans/github
curl -fsSL https://raw.githubusercontent.com/LeonTing1010/tap-skills/main/claims/2026-07-11-github-trending-has-no-api/plan.json \
  -o ~/.tap/plans/github/trending-no-api.plan.json
npx -y @taprun/cli github/trending-no-api
```

Expected: `"state": "committed"` and a `return` of

```jsonc
{
  "outcome": "ok",
  "api_directory_has_trending": false,   // ← the claim, machine-checked
  "repo_count": 19,                       // today's trending repos, extracted
  "repos": [ ... ]                        //   deterministically — zero LLM tokens
}
```

The plan is 3 ops of plain JSON ([plan.json](plan.json)) — read it before you run it.
It fetches two public URLs and parses HTML engine-side. No credentials, no telemetry.

## Refute it

Think this is wrong, or the run fails for you?
[Open an issue](https://github.com/LeonTing1010/tap-skills/issues/new) with your run
output. If you're right, the claim gets flipped publicly — refutations are the product
working as intended, not a failure.

## Receipts

Nightly CI runs land in [`receipts/`](receipts/) as `{date, state, outcome,
api_directory_has_trending, repo_count, plan_hash}` — verification metadata only,
never scraped content.

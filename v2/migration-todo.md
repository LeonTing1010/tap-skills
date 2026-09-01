# tap-skills v1 → v2 migration TODO

**Generated:** 2026-05-03 (Track 7 of ADR `2026-05-04-ecosystem-v2-launch.md` §6.3)
**Tool:** `deno run --allow-all /Users/leo/Projects/tap/core/src/migrate-legacy.ts scan` over a `taps/` mirror of `tap-skills/{community,showcase}/`.
**Verdict counts:** scanned 72 · auto-migratable 0 · needs-rewrite 72 · invalid 0 · errored 0.

The ADR claimed "65+ community taps." Actual: 57 in `community/` + 15 in `showcase/` = **72 total**. Eight more than headline.

**Why 0 auto-migratable:** every v1 tap stores the entire compiled body inside a single `op:"exec"` step (the v0.x compiler's universal fallback shape). `exec` is in `DELETED_OPS` for v2 (`core/migration/legacy-detect.ts`), so `migrate-legacy` correctly refuses to auto-translate them. The five `showcase/tap/*` pipeline taps (`sort`, `pick`, `filter`, `limit`, `dedupe`) use single-op bodies whose op-names are also in DELETED_OPS — these are now built-in PipeOp templates (`core/compose/builtin.ts`), so the canonical v2 form is "pipeline taps don't need to ship as community plans at all" rather than "rewrite them."

---

## Top 3 reasons for needs-rewrite

1. **`op:exec` body wrapping page-context DOM scrape (29 taps)** — pattern: `exec` calls `handle.eval(...)` over `document.querySelectorAll(...)`. v2 rewrite path: emit a `nav` + `eval` (page-world JS, restricted) + `extract` triple, or — preferred — author a Layer-1 declared-source plan if the site exposes JSON-LD/RSS/OpenAPI.
2. **`op:exec` body wrapping bare `fetch()` API call (24 taps)** — pattern: `exec` body = `await fetch(api/...)` with optional Bearer header. v2 rewrite is a one-line `op:fetch` with `credentials:"deno-host"` (or `"page-session"` for cookied APIs); near-mechanical translation, blocked only by op:exec being the carrier.
3. **`op:exec` body wrapping native/JXA calls or non-deterministic shell-out (14 taps)** — `shortcuts/{run,list}`, `notes/create`, `reminders/pending`, `calendar/today`, `macos/scroll-capture`, plus `discord/send`, `slack/send`, `daily/brief`, `scys/{input-keyword,research}`, `tap/table`. These call Apple JXA via `tap.eval` or compose multi-API workflows. Cannot mechanically translate — needs runtime-substrate-specific rewrite (macOS plans must declare `requires.runtime: "macos"`; Discord/Slack need `op:fetch` + secrets).

Plus 5 single-op pipeline taps (`tap/{sort,pick,filter,limit,dedupe}`) that are now redundant with v2 built-in PipeOp templates — drop, don't rewrite.

---

## Per-tap action list

Format: `<site>/<name>` — category — original path — recommended v2 path.

### Category A — exec wrapping API fetch (mechanical rewrite, ~24 taps)

| Tap | v1 path | Notes |
|---|---|---|
| arxiv/search | community/arxiv/search.tap.json | bare fetch to export.arxiv.org |
| crates/popular | community/crates/popular.tap.json | bare fetch to crates.io API |
| creem/create-product | community/creem/create-product.tap.json | bearer; secret `CREEM_API_KEY` |
| creem/products | community/creem/products.tap.json | bearer |
| creem/subscriptions | community/creem/subscriptions.tap.json | bearer |
| creem/transactions | community/creem/transactions.tap.json | bearer |
| creem/validate-license | community/creem/validate-license.tap.json | bearer |
| devto/top | community/devto/top.tap.json | dev.to public REST |
| douban/hot | community/douban/hot.tap.json | bare fetch |
| github/create-issue | community/github/create-issue.tap.json | bearer; `GITHUB_TOKEN` |
| google/trends | community/google/trends.tap.json | bare fetch (likely page-session) |
| pixiv/ranking | community/pixiv/ranking.tap.json | bare fetch |
| pypi/top | community/pypi/top.tap.json | bare fetch |
| sspai/hot | community/sspai/hot.tap.json | bare fetch |
| stackoverflow/hot | community/stackoverflow/hot.tap.json | bare fetch |
| steam/top-sellers | community/steam/top-sellers.tap.json | bare fetch |
| toutiao/hot | community/toutiao/hot.tap.json | bare fetch |
| v2ex/hot | community/v2ex/hot.tap.json | v2ex API |
| weather/forecast | community/weather/forecast.tap.json | open-meteo |
| xueqiu/hot-stock | community/xueqiu/hot-stock.tap.json | likely page-session |
| lobsters/hot | showcase/lobsters/hot.tap.json | RSS — declared-source candidate |
| producthunt/relevant | showcase/producthunt/relevant.tap.json | API |
| techcrunch/latest | showcase/techcrunch/latest.tap.json | RSS — declared-source candidate |
| wikipedia/most-read | showcase/wikipedia/most-read.tap.json | wikipedia REST |
| juejin/hot | community/juejin/hot.tap.json | bearer |
| weibo/hot | showcase/weibo/hot.tap.json | bearer or page-session |

### Category B — exec wrapping page-context DOM scrape (~29 taps; rewrite to nav+eval+extract or Layer-1)

| Tap | v1 path |
|---|---|
| arstechnica/news | community/arstechnica/news.tap.json |
| bbc/news | community/bbc/news.tap.json |
| calendar/today | community/calendar/today.tap.json |
| clawhub/publish | community/clawhub/publish.tap.json |
| devto/post | community/devto/post.tap.json |
| espn/scores | community/espn/scores.tap.json |
| feishu/doc | community/feishu/doc.tap.json |
| glama/submit | community/glama/submit.tap.json |
| imdb/top | community/imdb/top.tap.json |
| instagram/explore | community/instagram/explore.tap.json |
| juejin/post | community/juejin/post.tap.json |
| linkedin/post | community/linkedin/post.tap.json |
| macos/scroll-capture | community/macos/scroll-capture.tap.json |
| medium/hot | community/medium/hot.tap.json |
| notes/create | community/notes/create.tap.json |
| notion/create | community/notion/create.tap.json |
| npmjs/popular | community/npmjs/popular.tap.json |
| quora/feed-jp | community/quora/feed-jp.tap.json |
| reminders/pending | community/reminders/pending.tap.json |
| reuters/news | community/reuters/news.tap.json |
| rottentomatoes/opening | community/rottentomatoes/opening.tap.json |
| scys/article | community/scys/article.tap.json |
| scys/extract-results | community/scys/extract-results.tap.json |
| scys/nav | community/scys/nav.tap.json |
| scys/search | community/scys/search.tap.json |
| scys/trigger-search | community/scys/trigger-search.tap.json |
| shortcuts/list | community/shortcuts/list.tap.json |
| shortcuts/run | community/shortcuts/run.tap.json |
| telegraph/nav | community/telegraph/nav.tap.json |
| tiktok/trending | community/tiktok/trending.tap.json |
| v2ex/post | community/v2ex/post.tap.json |
| devto/publish | showcase/devto/publish.tap.json |
| github/trending | showcase/github/trending.tap.json |
| hackernews/hot | showcase/hackernews/hot.tap.json |
| hackernews/submit | showcase/hackernews/submit.tap.json |

### Category C — exec wrapping native / multi-step / non-deterministic (~9 taps; runtime-specific)

| Tap | v1 path | Constraint |
|---|---|---|
| daily/brief | community/daily/brief.tap.json | composite multi-fetch |
| discord/send | community/discord/send.tap.json | webhook; `DISCORD_WEBHOOK_URL` |
| scys/input-keyword | community/scys/input-keyword.tap.json | type+click |
| scys/research | community/scys/research.tap.json | composite |
| slack/send | community/slack/send.tap.json | webhook; `SLACK_WEBHOOK_URL` |
| tap/table | showcase/tap/table.tap.json | renderer — possibly drop |

### Category D — single-op pipeline ops, retired by v2 built-ins (5 taps; DROP, do not rewrite)

| Tap | v1 path | v2 replacement |
|---|---|---|
| tap/dedupe | showcase/tap/dedupe.tap.json | built-in PipeOp `dedupe` |
| tap/filter | showcase/tap/filter.tap.json | built-in PipeOp `filter` |
| tap/limit | showcase/tap/limit.tap.json | built-in PipeOp `limit` |
| tap/pick | showcase/tap/pick.tap.json | built-in PipeOp `pick` |
| tap/sort | showcase/tap/sort.tap.json | built-in PipeOp `sort` |

---

## Process notes

- v1 files in `community/` and `showcase/` were NOT moved/renamed/deleted (Track 7 constraint). The ADR's `community/ → /v1/community/` rename is a B-class coordinated action.
- The `tap-v2 migrate-legacy` CLI scans `<root>/taps/` and writes to `<root>/plans/<site>/<name>.plan.json`. The ADR-declared `/v2/@taprun/<site>/<name>.plan.json` layout is a downstream packaging concern; with 0 auto-migratable plans there is nothing to relocate.
- Working invocation: `deno run --allow-all /Users/leo/Projects/tap/core/src/migrate-legacy.ts {scan|migrate} --root <dir>` where `<dir>/taps/` contains the v1 corpus.
- Per ADR §6.3 the next step is GitHub issues, one per needs-rewrite tap, inviting the original author to assist. Track 7 explicitly defers issue-opening (push action). When that runs, batch by category for efficiency: a single "Category A migration template" issue covers 24 mechanical translations.

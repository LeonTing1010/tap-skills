# Contributing to tap-skills

Thanks for contributing! Every skill you add or fix benefits every Tap user and every AI agent connected via MCP.

## Quick Start

```bash
# Fork on GitHub, then:
git clone https://github.com/<you>/tap-skills && cd tap-skills

# Create a skill, validate, test, submit PR
```

## Adding a New Skill

Tap skills are `.tap.json` files (W3C Annotation envelope wrapping an
`ExecutionPlan`). Hand-authoring is rare — `tap forge` produces them
directly from a URL or natural-language intent.

### 1. Forge it

```bash
tap forge "https://mysite.com/trending"
# → showcase/mysite/hot.tap.json   (or community/, depending on placement)

tap forge "post a comment on hackernews"
# → produces a write-tap with intent:"write"
```

The forger picks the highest-quality source it can find:
declared (Layer 1: agents.json / OpenAPI / JSON-LD / RSS / OpenGraph) →
inferred API → ARIA → CSS. Layer 1 produces the most stable taps and
costs zero LLM tokens. Layers 2+ require a Hacker license.

### 2. (Or) hand-author from a template

Copy any existing `.tap.json` in `showcase/` or `community/` as a
template. The schema is `@taprun/spec/schemas/plan-v1.schema.json`
(see `npm:@taprun/spec`). Path layout:

```
showcase/<site>/<name>.tap.json     curated, sparse-checked-out by default
community/<site>/<name>.tap.json    long tail, fetched via `tap update --all`
```

- `site` = lowercase site/app name (`github`, `weibo`, `calendar`)
- `name` = action (`trending`, `hot`, `search`, `post`, `publish`)
- One skill per file. One capability per skill.
- Body must include `site`, `name`, `intent` (`read`|`write`),
  `description`, and a non-empty `ops` array.
- Read-only taps default to `intent:"read"` and run under doctor
  automatically. `intent:"write"` skips doctor unless `--all`.

### 3. Strategy guidelines

**Declared > inferred > DOM.** This is the most important rule, and
the forger applies it automatically. If you hand-author, follow the
same order:

```
Best:  declared L1 source — agents.json / OpenAPI / JSON-LD / RSS / OpenGraph
Good:  inferred API — `op:fetch` against an authenticated JSON endpoint
OK:    DOM extraction — `op:exec` querying `document.querySelectorAll(...)`
Last:  interactive sequences — nav + click + type + eval (most fragile)
```

How to find APIs:
1. Open DevTools Network tab
2. Load the page, filter by XHR/Fetch
3. Look for JSON responses with the data you need
4. Use that API endpoint in your tap

## Validation

Every PR is validated by CI. Run locally before submitting:

```bash
node test/tap-format.test.mjs
```

This checks:
- No `.tap.js` files anywhere (hard gate, retired 2026-04-27)
- File parses as a W3C Annotation with a `tap:ExecutionPlan` body
- `site` and `name` match directory/filename
- Non-empty `ops` array; every op has a string `op` field
- Valid args types, health contract, semver `requires`
- For `op:exec` source: no `chrome.*`, no `eval()` / `new Function()` /
  `atob` / `WebSocket` / `XMLHttpRequest` / dynamic `import()`,
  fetch URLs related to the declared site
- Composition references (`handle.run("site","name")`) resolve to
  existing taps in `showcase/` or `community/`

## Testing Your Skill

```bash
# Browser (Chrome Extension runtime — uses your real login)
tap mysite hot

# Headless (Playwright — no login, good for public pages)
tap --runtime playwright mysite hot

# macOS native app
tap --runtime macos calendar today

# With arguments
tap x post --content "Hello world"
```

## Pull Request Process

1. **One skill per PR** (unless they're closely related, e.g. `site/hot` + `site/search`)
2. **Title format**: `feat: add site/name` or `fix: site/name selector update`
3. **Test locally** — show the output in your PR description
4. **CI must pass** — `node test/tap-format.test.mjs`

### PR description template

```
## What
Added `mysite/hot` — trending posts from MySite.

## Strategy
API-first: uses /api/v1/trending endpoint, returns JSON directly.

## Test output
$ tap mysite hot --limit 3
title           | url
"First post"    | "https://mysite.com/1"
"Second post"   | "https://mysite.com/2"
"Third post"    | "https://mysite.com/3"
```

## Fixing a Broken Skill

Sites change their DOM and APIs. When a skill breaks:

1. `tap doctor site/name` — note the drift report
2. `tap heal site/name` (Pro) auto-patches via cache → minimal-patch →
   full-rewrite. For free-tier or hand fixes: edit `ops` directly in
   the `.tap.json`, or `tap forge` afresh and diff against the broken
   version
3. Validate: `node test/tap-format.test.mjs`
4. Test: `tap site/name`
5. Submit PR: `fix: site/name — updated <op> for new layout`

## Naming Conventions

| Pattern | Meaning | Examples |
|---------|---------|---------|
| `hot` | Trending / popular | `zhihu/hot`, `weibo/hot` |
| `top` | Top / best | `devto/top`, `producthunt/hot` |
| `search` | Search with keyword arg | `reddit/search`, `arxiv/search` |
| `detail` | Single item detail (needs URL arg) | `zhihu/detail`, `bilibili/detail` |
| `comment` | Comments on an item | `zhihu/comment`, `weibo/comment` |
| `open` | Open item in browser | `zhihu/open`, `douyin/open` |
| `post` | Short-form publish | `x/post`, `reddit/post` |
| `publish` | Long-form publish | `zhihu/publish`, `medium/publish` |
| `send` | Send message | `slack/send`, `discord/send` |

## Code of Conduct

Be respectful. Review others' PRs constructively. Help newcomers.

## License

By contributing, you agree that your contributions will be licensed under AGPL-3.0.

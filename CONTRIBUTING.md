# Contributing to tap-skills

Thanks for contributing! Every skill you add or fix benefits every Tap user and every AI agent connected via MCP.

## Quick Start

```bash
# Fork on GitHub, then:
git clone https://github.com/<you>/tap-skills && cd tap-skills

# Create a skill, validate, test, submit PR
```

## Adding a New Skill

### 1. Choose the right format

| Format | When to use | Example |
|--------|------------|---------|
| **Extract** | Read-only data extraction (trending, search, feeds) | `github/trending` |
| **Run** | Write actions, interactive flows, cross-tap composition | `x/post`, `daily/brief` |

### 2. Create the file

```
site/name.tap.js
```

- `site` = lowercase site or app name (e.g. `github`, `weibo`, `calendar`)
- `name` = action name (e.g. `trending`, `hot`, `search`, `post`, `publish`)
- One skill per file. One capability per skill.

### 3. Extract format template

For read-only data extraction. The runtime handles navigation, waiting, limiting, and column inference.

```js
export default {
  site: "mysite",
  name: "hot",
  description: "Trending posts on MySite",
  url: "https://mysite.com/trending",
  // Optional: wait for a specific element before extracting
  // waitFor: ".post-item",
  // Optional: custom timeout in ms (default: 30000)
  // timeout: 10000,
  // Optional: health check — CI can catch regressions
  // health: { min_rows: 5, non_empty: ["title"] },

  extract: () => {
    return Array.from(document.querySelectorAll('.post-item')).map(el => ({
      title: el.querySelector('h2')?.textContent?.trim() || '',
      url: el.querySelector('a')?.href || '',
      author: el.querySelector('.author')?.textContent?.trim() || ''
    }))
  }
}
```

**Extract format rules:**
- Must have `url` (string or function)
- Must NOT have `columns` — runtime infers from return value
- Must NOT have `args.limit` — runtime provides default (20)
- Must NOT have `wait` — runtime uses adaptive retry
- Prefer API over DOM: if the site has a JSON API, use `fetch()` instead of DOM selectors

**API-first extract example:**

```js
export default {
  site: "bilibili",
  name: "hot",
  description: "Bilibili trending videos",
  url: "https://www.bilibili.com",
  health: { min_rows: 5, non_empty: ["title"] },

  extract: async () => {
    const res = await fetch('https://api.bilibili.com/x/web-interface/ranking/v2',
      { credentials: 'include' })
    const data = await res.json()
    return data.data.list.map(v => ({
      title: v.title,
      author: v.owner.name,
      views: String(v.stat.view),
      url: 'https://bilibili.com/video/' + v.bvid
    }))
  }
}
```

### 4. Run format template

For write actions, interactive flows, or taps that compose other taps.

```js
export default {
  site: "mysite",
  name: "post",
  description: "Post content to MySite",
  columns: ["status", "url"],
  args: {
    content: { type: "string", description: "Post content" },
    // Optional args:
    // title: { type: "string", optional: true },
  },

  async run(page, args) {
    if (!args.content) throw new Error('content is required')

    await page.nav('https://mysite.com/compose')
    await page.type('.editor', args.content)
    await page.click('.submit-btn')
    await page.wait(2000)

    const url = await page.eval(() => location.href)
    return [{ status: 'posted', url }]
  }
}
```

**Run format rules:**
- Must have `columns` (non-empty string array)
- Must return array of objects matching declared columns
- `args` types: `string`, `int`, `float`, `boolean`
- No `chrome.*` APIs — use page API only

### 5. Page API reference

Available methods in `run(page, args)`:

| Method | Purpose |
|--------|---------|
| `page.nav(url)` | Navigate to URL |
| `page.click(selector)` | Click element |
| `page.type(selector, text)` | Type into element |
| `page.fill(selector, value)` | Set input value |
| `page.eval(fn, ...args)` | Execute JS in page |
| `page.fetch(url, options)` | Fetch with page cookies |
| `page.find(selector)` | Find elements |
| `page.wait(ms)` | Wait milliseconds |
| `page.hover(selector)` | Hover element |
| `page.scroll(direction, amount)` | Scroll page |
| `page.pressKey(key)` | Press keyboard key |
| `page.select(selector, value)` | Select dropdown option |
| `page.upload(selector, path)` | Upload file |
| `page.cookies()` | Get cookies |
| `page.storage()` | Get localStorage |
| `page.tap(site, name, args)` | Call another tap (composition) |

### 6. Strategy guidelines

**API first, DOM fallback.** This is the most important rule.

```
Best:  fetch('https://api.site.com/v1/trending')     → structured JSON, fast, stable
Good:  page.fetch('https://site.com/api/data')        → uses page cookies, same benefits
OK:    document.querySelectorAll('.item')              → DOM extraction, breaks on redesign
Last:  page.click() + page.type() + page.eval()       → interactive, most fragile
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
- `site` and `name` match directory/filename
- Exactly one of `extract()` or `run()`
- Valid args types
- Health contract validity
- No `chrome.*` direct references
- Extract format doesn't have `columns`, `args.limit`, or `wait`
- Run format has `columns`
- Composition references (`page.tap()`) resolve to existing taps

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

1. Run the skill, note the error
2. Open the site in Chrome, inspect what changed
3. Update selectors or API endpoints
4. Validate: `node test/tap-format.test.mjs`
5. Test: `tap site name`
6. Submit PR: `fix: site/name — updated selector for new layout`

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

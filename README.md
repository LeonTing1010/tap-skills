<p align="center">
  <img src="https://raw.githubusercontent.com/LeonTing1010/tap/main/extension/icons/icon.svg" width="120" height="120" alt="Tap">
  <h1 align="center">tap-skills</h1>
  <p align="center"><b>200+ community skills across 65+ sites for <a href="https://github.com/LeonTing1010/tap">Tap</a></b></p>
  <p align="center"><i>AI compiles it once. Programs run forever at $0. | <a href="https://taprun.dev">taprun.dev</a></i></p>
</p>

<p align="center">
  <a href="https://github.com/LeonTing1010/tap-skills/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/LeonTing1010/tap-skills/ci.yml?style=flat-square&label=CI" alt="CI"></a>
  <a href="https://github.com/LeonTing1010/tap-skills/stargazers"><img src="https://img.shields.io/github/stars/LeonTing1010/tap-skills?style=flat-square" alt="Stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/LeonTing1010/tap-skills?style=flat-square" alt="License"></a>
  <a href="https://github.com/LeonTing1010/tap-skills/pulls"><img src="https://img.shields.io/github/issues-pr/LeonTing1010/tap-skills?style=flat-square&label=PRs" alt="PRs"></a>
</p>

---

This is the community skills repository for [Tap](https://github.com/LeonTing1010/tap) — the AI interface compiler. Every `.tap.js` file here is a deterministic script that runs forever with zero AI tokens. See [taprun.dev](https://taprun.dev) for the product.

## Install

```bash
# Install Tap (includes skills automatically)
curl -fsSL https://taprun.dev/install.sh | sh

# Update skills to latest
tap update
```

## Usage

```bash
tap list                             # See all available skills
tap github trending                  # CLI
tap --runtime playwright weibo hot   # Headless
tap --runtime macos calendar today   # macOS native apps
```

Or via MCP in any AI agent (Claude Code, Cursor, Windsurf, etc.):

```
You:  What's trending on GitHub?
Agent: [calls tap.run("github", "trending")]
```

## Skill Catalog

### Trending / Hot

| Site | Skill |
|------|-------|----------|
| GitHub | `github/trending` |
| Hacker News | `hackernews/hot` |
| Reddit | `reddit/hot` |
| Product Hunt | `producthunt/hot` |
| X / Twitter | `x/trending` |
| YouTube | `youtube/trending` |
| Bluesky | `bluesky/trending` |
| Bilibili | `bilibili/hot` |
| Zhihu | `zhihu/hot` |
| Weibo | `weibo/hot` |
| Xiaohongshu | `xiaohongshu/hot` |
| Douyin | `douyin/hot` |
| V2EX | `v2ex/hot` |
| Juejin | `juejin/hot` |
| Lobsters | `lobsters/hot` |
| Dev.to | `devto/top` |
| Stack Overflow | `stackoverflow/hot` |
| Medium | `medium/hot` |
| 36Kr | `36kr/hot` |
| Toutiao | `toutiao/hot` |
| Baidu | `baidu/hot` |
| SSPai | `sspai/hot` |
| Douban | `douban/hot` |
| CoinGecko | `coingecko/top` |
| Steam | `steam/top-sellers` |
| Crates.io | `crates/popular` |
| PyPI | `pypi/top` |
| Pixiv | `pixiv/ranking` |
| Wikipedia | `wikipedia/most-read` |
| Google Trends | `google/trends` |
| Xueqiu | `xueqiu/hot-stock` |

### Search

| Site | Skill |
|------|-------|----------|
| Reddit | `reddit/search` |
| arXiv | `arxiv/search` |
| X / Twitter | `x/search` |
| Medium | `medium/search` |
| Zhihu | `zhihu/search` |
| Weibo | `weibo/search` |
| Xiaohongshu | `xiaohongshu/search` |
| Bilibili | `bilibili/search` |
| Douyin | `douyin/search` |
| WeChat | `wechat/search` |
| Dictionary | `dictionary/search` |

### Deep Read (detail + comments)

| Site | Skills |
|------|--------|
| Zhihu | `detail`, `comment`, `open`, `answer` |
| Weibo | `detail`, `comment`, `open` |
| Bilibili | `detail`, `comment`, `open`, `reply` |
| Xiaohongshu | `detail`, `post_detail`, `comment`, `open`, `reply` |
| Douyin | `detail`, `comment`, `open`, `reply` |
| WeChat | `detail`, `open`, `articles`, `app-search` |
| WeRead | `shelf`, `highlights` |

### Write / Publish

| Skill | What it does |
|-------|-------------|
| `x/post` | Post a tweet |
| `weibo/post` | Post on Weibo |
| `xiaohongshu/publish` | Publish a note with images |
| `xiaohongshu/publish_text` | Publish a text note |
| `zhihu/publish` | Publish a Zhihu column article |
| `juejin/publish` | Publish a Juejin article |
| `devto/publish` | Publish a Dev.to article |
| `medium/publish` | Publish a Medium article |
| `telegraph/publish` | Publish a Telegraph article |
| `linkedin/post` | Post on LinkedIn |
| `reddit/post` | Submit a Reddit post |
| `reddit/comment` | Comment on a Reddit post |
| `hackernews/submit` | Submit to Hacker News |
| `v2ex/post` | Post a V2EX topic |
| `notion/create` | Create a Notion page |
| `discord/send` | Send a Discord message |
| `slack/send` | Send a Slack message |
| `jimeng/generate` | Generate AI images |

### macOS Native Apps

Requires `--runtime macos`. Automates desktop apps via Accessibility API + JXA.

| Skill | What it does |
|-------|-------------|
| `calendar/today` | Today's calendar events |
| `reminders/pending` | Incomplete reminders |
| `notes/create` | Create a note in Apple Notes |
| `shortcuts/list` | List available Shortcuts |
| `shortcuts/run` | Run a Shortcut by name |
| `daily/brief` | Cross-app briefing (composes all above) |
| `macos/scroll-capture` | Full-page scroll capture |

### Other

| Skill | What it does |
|-------|-------------|
| `github/issues` | List repo issues |
| `github/stars` | Stargazers list |
| `github/create-issue` | Create a GitHub issue |
| `instagram/explore` | Instagram explore feed |
| `facebook/feed` | Facebook news feed |
| `tiktok/trending` | TikTok trending |
| `feishu/doc` | Feishu/Lark document |
| `clawhub/publish` | Publish to ClawHub |
| `glama/submit` | Submit to Glama |
| `scys/search` | SCYS search |
| `xiaohongshu/follow` | Follow a user |
| `xiaohongshu/like` | Like a note |
| `xiaohongshu/profile` | User profile |
| `xiaohongshu/my_notes` | My published notes |
| `xiaohongshu/notifications` | Notifications |

## .tap.js Format

Every skill is a single `.tap.js` file with a default export. Two formats:

### Extract format (read-only data)

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
      title: v.title, author: v.owner.name,
      views: String(v.stat.view),
      url: 'https://bilibili.com/video/' + v.bvid
    }))
  }
}
```

Runtime handles: navigation, waiting, limit, column inference, health checks.

### Run format (interactive / write / composition)

```js
export default {
  site: "x",
  name: "post",
  description: "Post a tweet on X/Twitter",
  columns: ["status", "url"],
  args: {
    content: { type: "string", description: "Tweet text" }
  },

  async run(page, args) {
    await page.nav('https://x.com/home')
    await page.click('[data-testid="tweetTextarea_0"]')
    await page.eval((text) => {
      const el = document.querySelector('[data-testid="tweetTextarea_0"]');
      if (el) { el.focus(); document.execCommand('insertText', false, text); }
    }, args.content)
    await page.click('[data-testid="tweetButtonInline"]')
    await page.wait(3000)
    return [{ status: 'posted', url: await page.eval(() => location.href) }]
  }
}
```

Tap controls everything: navigation, waiting, page interaction, return values.

### Key rules

- **API first, DOM fallback.** Use `fetch()` when an API exists. Only use DOM selectors when there's no API.
- **`site` must match directory name, `name` must match filename.** `github/trending.tap.js` → `site: "github", name: "trending"`.
- **Extract format must NOT have** `columns`, `args.limit`, or `wait` — the runtime provides these.
- **Run format must have** `columns` — the runtime can't infer without executing.
- **No `chrome.*` APIs.** Use the page API (`page.nav`, `page.click`, `page.eval`, etc.).
- **Health contracts** (`min_rows`, `non_empty`) catch failures before they reach the user.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide. Quick version:

```bash
# 1. Fork and clone
git clone https://github.com/<you>/tap-skills && cd tap-skills

# 2. Create your skill
mkdir -p mysite && cat > mysite/hot.tap.js << 'EOF'
export default {
  site: "mysite", name: "hot",
  description: "Trending on MySite",
  url: "https://mysite.com/trending",
  extract: () => Array.from(document.querySelectorAll('.item')).map(el => ({
    title: el.querySelector('h2')?.textContent?.trim() || '',
    url: el.querySelector('a')?.href || ''
  }))
}
EOF

# 3. Validate
node test/tap-format.test.mjs

# 4. Test live
tap mysite hot

# 5. Submit PR
```

Every contribution — from fixing a broken selector to adding a new site — is welcome.

## Priority

User taps (`~/.tap/taps/`) override community skills. If you customize a skill for personal use, save it to `~/.tap/taps/site/name.tap.js` instead of modifying this repo.

## License

AGPL-3.0 — see [LICENSE](LICENSE).

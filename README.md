<p align="center">
  <img src="https://raw.githubusercontent.com/LeonTing1010/tap/main/extension/icons/icon.svg" width="120" height="120" alt="Tap">
</p>

<h1 align="center">tap-skills</h1>

<p align="center">
  <b>200+ community skills across 65+ sites for <a href="https://github.com/LeonTing1010/tap">Tap</a></b>
</p>

<p align="center">
  <i>AI compiles it once. Programs run forever at $0.</i> &nbsp;|&nbsp; <a href="https://taprun.dev">taprun.dev</a>
</p>

<p align="center">
  <a href="https://github.com/LeonTing1010/tap-skills/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/LeonTing1010/tap-skills/ci.yml?style=flat-square&label=CI" alt="CI"></a>
  <a href="https://github.com/LeonTing1010/tap-skills/stargazers"><img src="https://img.shields.io/github/stars/LeonTing1010/tap-skills?style=flat-square" alt="Stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/LeonTing1010/tap-skills?style=flat-square" alt="License"></a>
  <a href="https://github.com/LeonTing1010/tap-skills/pulls"><img src="https://img.shields.io/github/issues-pr/LeonTing1010/tap-skills?style=flat-square&label=PRs" alt="PRs"></a>
</p>

---

Community skills for [Tap](https://github.com/LeonTing1010/tap) — the AI interface compiler. Every `.tap.js` file is a program that runs forever with zero AI cost.

## Install

```bash
curl -fsSL https://taprun.dev/install.sh | sh   # Install Tap + skills
tap update                                        # Update to latest
```

## Usage

```bash
tap list                             # See all skills
tap github trending                  # Run a skill
tap weibo hot                        # 微博热搜
tap xiaohongshu search --keyword "AI"  # 小红书搜索
```

Or ask your AI agent (Claude Code, Cursor, etc.):

```
You:   What's trending on GitHub?
Agent: Here are today's top repos...
```

## Skills

### Trending

| Site | Skill |
|------|-------|
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
| Baidu | `baidu/hot` |
| CoinGecko | `coingecko/top` |
| Steam | `steam/top-sellers` |
| PyPI | `pypi/top` |
| Google Trends | `google/trends` |

### Search

| Site | Skill |
|------|-------|
| arXiv | `arxiv/search` |
| Reddit | `reddit/search` |
| Zhihu | `zhihu/search` |
| Xiaohongshu | `xiaohongshu/search` |
| Bilibili | `bilibili/search` |
| Weibo | `weibo/search` |
| X / Twitter | `x/search` |
| Wikipedia | `wikipedia/search` |
| Medium | `medium/search` |

### Read

| Site | Skill |
|------|-------|
| Zhihu | `zhihu/detail` |
| Bilibili | `bilibili/detail` |
| Xiaohongshu | `xiaohongshu/detail` |
| WeRead | `weread/books` |
| BBC | `bbc/news` |

### Write

| Site | Skill |
|------|-------|
| Xiaohongshu | `xiaohongshu/publish` |
| Zhihu | `zhihu/publish` |
| Bilibili | `bilibili/upload` |
| Dev.to | `devto/publish` |

## Writing a Skill

A skill is one `.tap.js` file:

```js
export default {
  site: "example",
  name: "trending",
  description: "Trending on Example.com",
  url: "https://example.com/trending",
  health: { min_rows: 3, non_empty: ["title"] },

  extract: () => Array.from(document.querySelectorAll('.item')).map(el => ({
    title: el.querySelector('h2')?.textContent?.trim() || '',
    url: el.querySelector('a')?.href || ''
  }))
}
```

Rules:
- **`site` = directory name, `name` = filename.** `github/trending.tap.js` → `site: "github", name: "trending"`
- **Include a health contract** — `min_rows` and `non_empty` catch failures early
- **All values must be strings** — use `String(val ?? "")` for null safety

## Contributing

```bash
# 1. Fork and clone
git clone https://github.com/<you>/tap-skills && cd tap-skills

# 2. Create your skill
mkdir -p mysite && vi mysite/hot.tap.js

# 3. Test it
tap mysite hot

# 4. Submit PR
```

Every contribution is welcome — from fixing a broken selector to adding a new site.

## Priority

User taps (`~/.tap/taps/`) override community skills. Customize a skill for personal use by saving to `~/.tap/taps/site/name.tap.js`.

## License

MIT — see [LICENSE](LICENSE).

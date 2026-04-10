<p align="center">
  <img src="https://raw.githubusercontent.com/LeonTing1010/tap/main/extension/icons/icon.svg" width="120" height="120" alt="Tap">
</p>

<h1 align="center">tap-skills</h1>

<p align="center">
  <b>140+ community skills across 68 sites for <a href="https://github.com/LeonTing1010/tap">Tap</a></b>
</p>

<p align="center">
  <i>AI compiles it once. Programs run forever at $0.</i> &nbsp;|&nbsp; <a href="https://taprun.dev">taprun.dev</a>
</p>

<p align="center">
  <a href="https://github.com/LeonTing1010/tap-skills/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/LeonTing1010/tap-skills/ci.yml?style=flat-square&label=CI" alt="CI"></a>
  <a href="https://github.com/LeonTing1010/tap-skills/stargazers"><img src="https://img.shields.io/github/stars/LeonTing1010/tap-skills?style=flat-square" alt="Stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/LeonTing1010/tap-skills?style=flat-square" alt="License"></a>
</p>

---

Community skills for [Tap](https://github.com/LeonTing1010/tap). Every `.tap.js` file is a deterministic program that runs forever at $0.

## Install & Usage

### Option 1 — Use in Claude Code / Cursor (Free)

```json
{ "mcpServers": { "tap": { "command": "tap", "args": ["mcp"] } } }
```

No extension needed. 140+ skills work immediately in any MCP agent.

### Option 2 — Zero-install via npx

```bash
npx -y @taprun/cli github trending
```

First call downloads the platform binary (~30MB) and caches it. Subsequent calls are instant.

### Option 3 — Permanent install via curl (macOS / Linux)

```bash
curl -fsSL https://taprun.dev/install.sh | sh
tap update                                        # Pull latest community skills
tap list                                          # See all skills
tap github trending                               # Run any skill
```

## All Skills

### Trending & Hot

| Site | Skill | Description |
|------|-------|-------------|
| GitHub | `github/trending` | Trending repositories |
| Hacker News | `hackernews/hot` | Top stories |
| Reddit | `reddit/hot` | Hot posts |
| Product Hunt | `producthunt/hot` | Today's hot products |
| X / Twitter | `x/trending` | Trending topics |
| YouTube | `youtube/trending` | Trending videos |
| Bluesky | `bluesky/trending` | Trending topics |
| Bilibili | `bilibili/hot` | Trending videos |
| Zhihu | `zhihu/hot` | Hot topics |
| Weibo | `weibo/hot` | Hot search |
| Xiaohongshu | `xiaohongshu/hot` | Hot search topics |
| Douyin | `douyin/hot` | Hot search |
| V2EX | `v2ex/hot` | Hot topics |
| Juejin | `juejin/hot` | Hot articles |
| Lobsters | `lobsters/hot` | Hot stories |
| Dev.to | `devto/top` | Top articles |
| Stack Overflow | `stackoverflow/hot` | Hot questions |
| Medium | `medium/hot` | Hot articles |
| 36Kr | `36kr/hot` | Tech & startup news |
| Baidu | `baidu/hot` | Hot search |
| Toutiao | `toutiao/hot` | Hot topics |
| SSPai | `sspai/hot` | Trending articles |
| Douban | `douban/hot` | Trending movies |
| TikTok | `tiktok/trending` | Trending videos |
| ESPN | `espn/scores` | Headlines & scores |
| CoinGecko | `coingecko/top` | Top cryptocurrencies |
| Steam | `steam/top-sellers` | Top selling games |
| Xueqiu | `xueqiu/hot-stock` | Hot stocks |
| Google | `google/trends` | Trending searches |

### News & Reading

| Site | Skill | Description |
|------|-------|-------------|
| BBC | `bbc/news` | Top stories |
| Reuters | `reuters/news` | Top news |
| TechCrunch | `techcrunch/latest` | Latest articles |
| Wikipedia | `wikipedia/most-read` | Most read today |
| WeRead | `weread/shelf` | Bookshelf |
| WeRead | `weread/highlights` | Book highlights |
| Rotten Tomatoes | `rottentomatoes/opening` | Popular movies |
| IMDB | `imdb/top` | Top movies |

### Search

| Site | Skill | Description |
|------|-------|-------------|
| arXiv | `arxiv/search` | Search papers |
| Reddit | `reddit/search` | Search posts |
| X / Twitter | `x/search` | Search posts |
| Zhihu | `zhihu/search` | Search questions |
| Weibo | `weibo/search` | Search posts |
| Xiaohongshu | `xiaohongshu/search` | Search notes |
| Xiaohongshu | `xiaohongshu/search_fast` | Fast HTTP search |
| Bilibili | `bilibili/search` | Search videos |
| Medium | `medium/search` | Search articles |
| WeChat | `wechat/search` | Search articles |
| Dictionary | `dictionary/search` | English dictionary |

### Deep Read

| Site | Skill | Description |
|------|-------|-------------|
| Zhihu | `zhihu/detail` | Question + answers + comments |
| Bilibili | `bilibili/detail` | Video details + comments |
| Weibo | `weibo/detail` | Post details + comments |
| Xiaohongshu | `xiaohongshu/detail` | Note details + comments |
| Xiaohongshu | `xiaohongshu/post_detail` | Search → open → extract |
| Douyin | `douyin/detail` | Video details + comments |
| WeChat | `wechat/detail` | Article full text |
| Feishu | `feishu/doc` | Feishu doc full text |

### Write & Publish

| Site | Skill | Description |
|------|-------|-------------|
| X / Twitter | `x/post` | Post a tweet |
| Xiaohongshu | `xiaohongshu/publish` | Publish image-text note |
| Xiaohongshu | `xiaohongshu/publish_text` | Publish text-only note |
| Weibo | `weibo/post` | Publish a post |
| Zhihu | `zhihu/publish` | Publish article |
| Zhihu | `zhihu/answer` | Write an answer |
| Bilibili | `bilibili/upload` | Upload video |
| Dev.to | `devto/publish` | Publish article |
| Medium | `medium/publish` | Publish article |
| Telegraph | `telegraph/publish` | Publish anonymous article |
| V2EX | `v2ex/post` | Post a topic |
| Reddit | `reddit/post` | Submit a post |
| LinkedIn | `linkedin/post` | Post content |

### Interact

| Site | Skill | Description |
|------|-------|-------------|
| Xiaohongshu | `xiaohongshu/comment` | Comment on note |
| Xiaohongshu | `xiaohongshu/like` | Like a note |
| Xiaohongshu | `xiaohongshu/follow` | Follow author |
| Xiaohongshu | `xiaohongshu/reply` | Reply to comments |
| Bilibili | `bilibili/comment` | Comment on video |
| Bilibili | `bilibili/reply` | Reply to comment |
| Weibo | `weibo/comment` | Comment on post |
| Zhihu | `zhihu/comment` | Comment on answer |
| Douyin | `douyin/comment` | Comment on video |
| Douyin | `douyin/reply` | Reply to comment |
| Reddit | `reddit/comment` | Comment on post |
| Discord | `discord/send` | Send message |
| Slack | `slack/send` | Send message |

### Navigate & Open

| Site | Skill | Description |
|------|-------|-------------|
| Xiaohongshu | `xiaohongshu/open` | Search → open note |
| Bilibili | `bilibili/open` | Open video |
| Weibo | `weibo/open` | Open post |
| Zhihu | `zhihu/open` | Open question |
| Douyin | `douyin/open` | Open video |
| WeChat | `wechat/open` | Open article |

### Creator Tools

| Site | Skill | Description |
|------|-------|-------------|
| Xiaohongshu | `xiaohongshu/profile` | Creator center data |
| Xiaohongshu | `xiaohongshu/my_notes` | Published notes + stats |
| Xiaohongshu | `xiaohongshu/notifications` | Followers, comments, likes |
| GitHub | `github/issues` | Repository issues |
| GitHub | `github/create-issue` | Create an issue |

### Packages & Dev

| Site | Skill | Description |
|------|-------|-------------|
| npm | `npmjs/popular` | Most popular packages |
| PyPI | `pypi/top` | Top Python packages |
| Crates.io | `crates/popular` | Popular Rust packages |
| Pixiv | `pixiv/ranking` | Daily illustration ranking |

### macOS Native

| App | Skill | Description |
|-----|-------|-------------|
| Calendar | `calendar/today` | Today's events |
| Reminders | `reminders/pending` | Incomplete reminders |
| Notes | `notes/create` | Create a note |
| Shortcuts | `shortcuts/list` | List shortcuts |
| Shortcuts | `shortcuts/run` | Run a shortcut |
| Weather | `weather/forecast` | Weather forecast |

### Utilities

| Name | Skill | Description |
|------|-------|-------------|
| Daily Brief | `daily/brief` | Calendar + Reminders summary |
| Filter | `tap/filter` | Filter rows by condition |
| Sort | `tap/sort` | Sort rows by field |
| Limit | `tap/limit` | Take first N rows |
| Pick | `tap/pick` | Select specific columns |
| Dedupe | `tap/dedupe` | Remove duplicate rows |

## Contributing

```bash
git clone https://github.com/<you>/tap-skills && cd tap-skills
mkdir -p mysite && vi mysite/hot.tap.js
tap mysite hot   # Test it
# Submit PR
```

Every contribution is welcome — from fixing a selector to adding a new site.

## License

MIT — see [LICENSE](LICENSE).

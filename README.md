# tap-skills

Community-maintained skills for [Tap](https://github.com/LeonTing1010/tap) — the universal protocol for AI to operate any interface.

## Install

```bash
tap install
```

This clones the repository to `~/.tap/skills/`. All skills are immediately available.

## Update

```bash
tap update
```

## Skills

### Browser (Chrome Extension / Playwright)

Each skill is a `.tap.js` file under `site/name.tap.js`:

```
github/trending    weibo/hot       xiaohongshu/hot
github/issues      weibo/search    xiaohongshu/search
hackernews/hot     bilibili/hot    douyin/hot
reddit/hot         zhihu/hot       toutiao/hot
producthunt/top    v2ex/hot        juejin/hot
```

Run with default (extension) or Playwright runtime:

```bash
tap github trending
tap --runtime playwright weibo hot
```

### macOS (native app automation)

Operate native Mac apps via Accessibility API + JXA. Requires `--runtime macos`.

```
calendar/today       — Today's calendar events
reminders/pending    — Incomplete reminders
notes/create         — Create a note in Apple Notes
shortcuts/list       — List available Apple Shortcuts
shortcuts/run        — Run any Shortcut by name
daily/brief          — Cross-app briefing (composes all above)
```

```bash
tap --runtime macos calendar today
tap --runtime macos reminders pending
tap --runtime macos shortcuts list
tap --runtime macos daily brief --save true
```

**Composition**: `daily/brief` calls `calendar/today` + `reminders/pending` + `notes/create` in one tap — cross-app workflow, zero API.

## Structure

```
site/
  name.tap.js        → tap <site> <name>
```

## Priority

User taps (`~/.tap/taps/`) override skills. If you fork a skill, save it to `~/.tap/taps/site/name.tap.js`.

## Contributing

1. Fork this repo
2. Add or modify a `.tap.js` file
3. Test: `tap <site> <name>` or `tap --runtime macos <site> <name>`
4. Submit a PR

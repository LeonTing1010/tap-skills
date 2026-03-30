# tap-skills

Community-maintained skills for [Tap](https://github.com/anthropics/tap) — the universal protocol for AI to operate any interface.

## Install

```bash
tap install
```

This clones the repository to `~/.tap/skills/`. All skills are immediately available.

## Update

```bash
tap update
```

## Structure

Each skill is a `.tap.js` file under `site/name.tap.js`:

```
xiaohongshu/
  hot.tap.js
  search.tap.js
  publish.tap.js
github/
  trending.tap.js
  issues.tap.js
weibo/
  hot.tap.js
  search.tap.js
```

## Priority

User taps (`~/.tap/taps/`) override skills. If you fork a skill, save it to `~/.tap/taps/site/name.tap.js`.

## Contributing

1. Fork this repo
2. Add or modify a `.tap.js` file
3. Test: `tap <site> <name>`
4. Submit a PR

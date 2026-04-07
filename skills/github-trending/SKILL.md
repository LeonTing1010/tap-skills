---
name: github-trending
description: GitHub Trending repositories
---
# Github Trending

GitHub Trending repositories

## Prerequisites

- **Node.js** (any recent version). Already present on every developer machine.
- **Browser runtime** (only if this skill drives a website): install the Tap Chrome extension from https://taprun.dev/install and sign in to the target site once. For headless mode, append `--runtime playwright` to the command below — no extension needed.

First-run install of the tap binary takes ~5 seconds via npx and is cached afterwards.

## Usage

```bash
npx -y @taprun/cli github trending
```

Verify the skill is currently healthy before relying on it:

```bash
npx -y @taprun/cli doctor github trending
```

## Reliability

Backed by Tap's deterministic runtime. Run `tap doctor github trending` to verify the skill is currently working.

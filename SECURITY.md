# Security Policy

## Reporting a Vulnerability

If you discover a security issue in a community skill, please report it responsibly:

1. **Do NOT open a public issue** if the vulnerability could be exploited.
2. Use [GitHub Security Advisories](https://github.com/LeonTing1010/tap-skills/security/advisories/new) to report privately.
3. Include: which skill, what it does wrong, and the potential impact.

For vulnerabilities in the Tap runtime itself, report to the [main repository](https://github.com/LeonTing1010/tap/security).

## Security Model

Skills in this repository are deterministic `.tap.js` scripts that:

- Run in the context of your existing browser session (Chrome Extension) or a Playwright instance
- Cannot access the filesystem, spawn processes, or make arbitrary network requests outside the page context
- Are validated by CI format checks on every PR
- Are open source — every line is auditable

## What to Watch For

When reviewing skill PRs, check for:

- **Data exfiltration**: skills should not send your data to third-party endpoints
- **Credential harvesting**: skills should not extract or store passwords/tokens
- **Unexpected navigation**: skills should only navigate to the declared site
- **Obfuscated code**: all code should be readable and clear

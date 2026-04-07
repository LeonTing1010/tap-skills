/**
 * Constraint: .tap.js format contract (v0.9+)
 * Classification: safety / what — invalid format = runtime crash
 *
 * Canonical shape (single function, explicit intent):
 *
 *   export default {
 *     site, name, description,
 *     intent: "read" | "write",   // optional, default "read"
 *     columns: ["..."],           // required
 *     health: { min_rows, non_empty },
 *     examples: [{...}],
 *     async tap(handle, args) { ... }
 *   }
 *
 * Run: node test/tap-format.test.mjs
 */

import { strict as assert } from 'node:assert'
import { readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import { pathToFileURL } from 'node:url'

const TAPS_DIR = new URL('../', import.meta.url).pathname
const VALID_ARG_TYPES = ['string', 'int', 'float', 'number', 'boolean']
const VALID_INTENTS = ['read', 'write']

let passed = 0
let failed = 0
const failures = []

function test(tapId, rule, fn) {
  try {
    fn()
    passed++
    console.log(`  \x1b[32m✓\x1b[0m ${rule}`)
  } catch (e) {
    failed++
    console.log(`  \x1b[31m✗\x1b[0m ${rule}`)
    console.log(`    ${e.message}`)
    failures.push({ tap: tapId, rule, message: e.message })
  }
}

async function testAsync(tapId, rule, fn) {
  try {
    await fn()
    passed++
    console.log(`  \x1b[32m✓\x1b[0m ${rule}`)
  } catch (e) {
    failed++
    console.log(`  \x1b[31m✗\x1b[0m ${rule}`)
    console.log(`    ${e.message}`)
    failures.push({ tap: tapId, rule, message: e.message })
  }
}

async function findTapFiles(dir) {
  const files = []
  for (const site of await readdir(dir)) {
    const sitePath = join(dir, site)
    try {
      for (const file of await readdir(sitePath)) {
        if (file.endsWith('.tap.js')) {
          files.push({ site, name: basename(file, '.tap.js'), path: join(sitePath, file) })
        }
      }
    } catch { /* not a directory */ }
  }
  return files
}

console.log('\n.tap.js format constraints (v0.9+ unified shape)\n')

const tapFiles = await findTapFiles(TAPS_DIR)

test('global', 'at least one .tap.js file exists', () => {
  assert(tapFiles.length > 0, `no .tap.js files found in ${TAPS_DIR}`)
})

for (const { site, name, path } of tapFiles) {
  const id = `${site}/${name}`
  console.log(`\n  ${id}.tap.js`)

  let mod
  await testAsync(id, `loads as ES module`, async () => {
    mod = await import(pathToFileURL(path))
    assert(mod.default, 'must have default export')
  })

  if (!mod?.default) continue
  const tap = mod.default

  // ===== STRUCTURE =====

  test(id, `has site (string)`, () => {
    assert.equal(typeof tap.site, 'string', 'site must be string')
  })

  test(id, `has name (string)`, () => {
    assert.equal(typeof tap.name, 'string', 'name must be string')
  })

  test(id, `has description (string)`, () => {
    assert.equal(typeof tap.description, 'string', 'description is required')
  })

  test(id, `site matches directory (${tap.site} === ${site})`, () => {
    assert.equal(tap.site, site)
  })

  test(id, `name matches filename (${tap.name} === ${name})`, () => {
    assert.equal(tap.name, name)
  })

  test(id, `has tap() function`, () => {
    assert.equal(typeof tap.tap, 'function',
      'must define `async tap(handle, args) { ... }` — single entry point')
  })

  if (!tap.tap) continue

  // ===== INTENT =====

  if (tap.intent !== undefined) {
    test(id, `intent is "read" or "write"`, () => {
      assert(VALID_INTENTS.includes(tap.intent),
        `intent must be one of ${VALID_INTENTS.join(' | ')}, got "${tap.intent}"`)
    })
  }

  // ===== ARGS =====

  if (tap.args) {
    test(id, `args have valid types`, () => {
      for (const [key, spec] of Object.entries(tap.args)) {
        assert(spec.type, `arg '${key}' missing type`)
        assert(VALID_ARG_TYPES.includes(spec.type), `arg '${key}' has invalid type '${spec.type}'`)
      }
    })
  }

  // ===== HEALTH =====

  if (tap.health) {
    test(id, `health contract is valid`, () => {
      if (tap.health.min_rows !== undefined) {
        assert.equal(typeof tap.health.min_rows, 'number')
        assert(tap.health.min_rows >= 0, 'min_rows must be >= 0')
      }
      if (tap.health.non_empty !== undefined) {
        assert(Array.isArray(tap.health.non_empty))
        if (tap.columns) {
          for (const field of tap.health.non_empty) {
            assert(tap.columns.includes(field), `health.non_empty field '${field}' not in columns`)
          }
        }
      }
    })
  }

  // ===== REQUIRES (semver) =====

  if (tap.requires) {
    test(id, `requires is valid semver range`, () => {
      assert.equal(typeof tap.requires, 'string', 'requires must be a semver string (e.g. ">=1.0.0")')
      assert(/^[><=^~]*\d+\.\d+\.\d+/.test(tap.requires), `requires "${tap.requires}" must be semver range`)
    })
  }

  // ===== SOURCE-LEVEL CHECKS =====

  const src = tap.tap.toString()

  test(id, `tap() body does not reference chrome.* directly`, () => {
    assert(!src.includes('chrome.tabs'), 'must not reference chrome.tabs — use handle API')
    assert(!src.includes('chrome.scripting'), 'must not reference chrome.scripting — use handle API')
    assert(!src.includes('chrome.debugger'), 'must not reference chrome.debugger — use handle API')
  })

  // ===== SECURITY =====

  test(id, `[security] no eval() — use handle.eval() instead`, () => {
    const lines = src.split('\n')
    for (const line of lines) {
      if (line.trimStart().startsWith('//')) continue
      if (/\beval\s*\(/.test(line) && !line.includes('handle.eval') && !line.includes('tap.eval') && !line.includes('page.eval')) {
        assert.fail(`eval() found — use handle.eval() for page-context execution`)
      }
    }
  })

  test(id, `[security] no new Function()`, () => {
    assert(!/new\s+Function\s*\(/.test(src), 'new Function() not allowed — logic must be in tap source')
  })

  test(id, `[security] no base64 decoding (atob)`, () => {
    assert(!/\batob\s*\(/.test(src), 'atob() not allowed — tap code must be readable')
  })

  test(id, `[security] no WebSocket`, () => {
    assert(!/new\s+WebSocket\s*\(/.test(src), 'WebSocket not allowed — use handle.fetch()')
  })

  test(id, `[security] no XMLHttpRequest`, () => {
    assert(!/XMLHttpRequest/.test(src), 'XMLHttpRequest not allowed — use handle.fetch()')
  })

  test(id, `[security] no dynamic import()`, () => {
    const lines = src.split('\n')
    for (const line of lines) {
      if (/\bimport\s*\(/.test(line) && !/export\s+default/.test(line) && !/ObjC\.import/.test(line)) {
        assert.fail('dynamic import() not allowed — taps must be self-contained')
      }
    }
  })

  test(id, `[security] fetch URLs related to site "${site}"`, () => {
    const fetchUrls = [...src.matchAll(/fetch\s*\(\s*["'`](https?:\/\/[^"'`\s]+)["'`]/g)]
    for (const [, url] of fetchUrls) {
      try {
        const hostname = new URL(url).hostname.toLowerCase()
        const siteLower = site.toLowerCase()
        const isSiteRelated = hostname.includes(siteLower) || siteLower.includes(hostname.replace('www.', '').split('.')[0])
        const isCommonCdn = /^(cdn|static|assets|api|img|media)\./i.test(hostname)
        assert(isSiteRelated || isCommonCdn,
          `fetch to "${hostname}" — tap for "${site}" should only access ${site}-related URLs`)
      } catch { /* non-parseable URL, skip */ }
    }
  })

  // ===== COLUMNS (optional — runtime infers from first row if absent) =====

  if (tap.columns !== undefined) {
    test(id, `columns is non-empty string array`, () => {
      assert(Array.isArray(tap.columns), `columns must be an array if declared`)
      assert(tap.columns.length > 0, `columns must not be empty when declared`)
      for (const col of tap.columns) {
        assert.equal(typeof col, 'string', `column must be string, got ${typeof col}`)
      }
    })
  }

  // ===== COMPOSITION =====
  // handle.run("site", "name") references must resolve to existing taps.

  const tapCalls = [...src.matchAll(/(?:handle|tap|page)\.run\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']/g)]
  for (const [, refSite, refName] of tapCalls) {
    test(id, `[composition] handle.run("${refSite}", "${refName}") references existing tap`, () => {
      const refPath = join(TAPS_DIR, refSite, `${refName}.tap.js`)
      assert(existsSync(refPath),
        `${id} calls handle.run("${refSite}", "${refName}") but ${refSite}/${refName}.tap.js does not exist`)
    })
  }
}

// --- Summary ---

console.log(`\n${'─'.repeat(50)}`)
console.log(`${passed + failed} constraints, ${passed} passed, ${failed} failed`)

if (failures.length > 0) {
  console.log(`\n\x1b[31mFailed:\x1b[0m\n`)
  for (const f of failures) {
    console.log(`  \x1b[31m✗\x1b[0m \x1b[1m${f.tap}\x1b[0m → ${f.rule}`)
    console.log(`    ${f.message}\n`)
  }
}

console.log('')
process.exit(failed > 0 ? 1 : 0)

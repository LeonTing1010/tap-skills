/**
 * Constraint: .tap.js format contract
 * Classification: safety / what — invalid format = runtime crash
 *
 * Two formats:
 *   extract-format: { site, name, description, url, extract() }
 *     - Runtime handles nav, wait, limit, columns inference, health defaults
 *     - Must NOT have: run(), columns, args.limit
 *
 *   run-format: { site, name, description, columns, run() }
 *     - Tap controls everything (interactive / composition taps)
 *     - Must NOT have: extract()
 *     - Must have: columns (can't infer without running)
 *
 * Run: node test/tap-format.test.mjs
 */

import { strict as assert } from 'node:assert'
import { readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import { pathToFileURL } from 'node:url'

// Skills are in repo root, test is in test/
const TAPS_DIR = new URL('../', import.meta.url).pathname
const VALID_ARG_TYPES = ['string', 'int', 'float', 'boolean']

let passed = 0
let failed = 0
const failures = []   // collect all failures for summary

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

// --- Constraints ---

console.log('\n.tap.js format constraints\n')

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
  const hasRun = typeof tap.run === 'function'
  const hasExtract = typeof tap.extract === 'function'
  const format = hasExtract ? 'extract' : 'run'

  // ===== COMMON CONSTRAINTS (both formats) =====

  test(id, `[common] has site`, () => {
    assert.equal(typeof tap.site, 'string', 'site must be string')
  })

  test(id, `[common] has name`, () => {
    assert.equal(typeof tap.name, 'string', 'name must be string')
  })

  test(id, `[common] has description`, () => {
    assert.equal(typeof tap.description, 'string', 'description is required')
  })

  test(id, `[common] site matches directory (${tap.site} === ${site})`, () => {
    assert.equal(tap.site, site)
  })

  test(id, `[common] name matches filename (${tap.name} === ${name})`, () => {
    assert.equal(tap.name, name)
  })

  test(id, `[common] has exactly one of run() or extract()`, () => {
    assert(hasRun || hasExtract, 'must have run() or extract()')
    assert(!(hasRun && hasExtract), 'must not have both run() and extract()')
  })

  // args validation (both formats)
  if (tap.args) {
    test(id, `[common] args have valid types`, () => {
      for (const [key, spec] of Object.entries(tap.args)) {
        assert(spec.type, `arg '${key}' missing type`)
        assert(VALID_ARG_TYPES.includes(spec.type), `arg '${key}' has invalid type '${spec.type}'`)
      }
    })
  }

  // health validation (both formats)
  if (tap.health) {
    test(id, `[common] health contract is valid`, () => {
      if (tap.health.min_rows !== undefined) {
        assert.equal(typeof tap.health.min_rows, 'number')
        assert(tap.health.min_rows > 0, 'min_rows must be > 0')
      }
      if (tap.health.non_empty !== undefined) {
        assert(Array.isArray(tap.health.non_empty))
        // Cross-check against columns if columns are declared
        if (tap.columns) {
          for (const field of tap.health.non_empty) {
            assert(tap.columns.includes(field), `health.non_empty field '${field}' not in columns`)
          }
        }
      }
    })
  }

  // requires validation (optional — declares protocol version dependency)
  if (tap.requires) {
    test(id, `[common] requires is valid semver range`, () => {
      assert.equal(typeof tap.requires, 'string', 'requires must be a semver string (e.g. ">=1.0.0")')
      assert(/^[><=^~]*\d+\.\d+\.\d+/.test(tap.requires), `requires "${tap.requires}" must be semver range`)
    })
  }

  // No chrome.* direct access (both formats)
  const checkFn = tap.run || tap.extract || tap.transform
  test(id, `[common] ${format}() body does not reference chrome.* directly`, () => {
    const src = checkFn.toString()
    assert(!src.includes('chrome.tabs'), 'must not reference chrome.tabs — use page API')
    assert(!src.includes('chrome.scripting'), 'must not reference chrome.scripting — use page API')
    assert(!src.includes('chrome.debugger'), 'must not reference chrome.debugger — use page API')
  })

  // ===== SECURITY CONSTRAINTS =====

  const fullSource = (await import('node:fs/promises')).readFileSync
    ? undefined  // readFileSync not available, use src below
    : undefined
  const src = checkFn.toString()

  test(id, `[security] no eval() — use tap.eval() instead`, () => {
    // Match eval( but not page.eval( or tap.eval(
    const lines = src.split('\n')
    for (const line of lines) {
      if (line.trimStart().startsWith('//')) continue
      if (/\beval\s*\(/.test(line) && !line.includes('page.eval') && !line.includes('tap.eval')) {
        assert.fail(`eval() found — use tap.eval() for page context execution`)
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
    assert(!/new\s+WebSocket\s*\(/.test(src), 'WebSocket not allowed — use tap.fetch()')
  })

  test(id, `[security] no XMLHttpRequest`, () => {
    assert(!/XMLHttpRequest/.test(src), 'XMLHttpRequest not allowed — use tap.fetch()')
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

  // ===== EXTRACT-FORMAT CONSTRAINTS =====

  if (hasExtract) {
    test(id, `[extract] has url (string or function)`, () => {
      const valid = (typeof tap.url === 'string' && tap.url.length > 0) || typeof tap.url === 'function'
      assert(valid, 'extract-format requires url (string or function)')
    })

    test(id, `[extract] must not have columns (runtime infers)`, () => {
      assert(tap.columns === undefined, 'extract-format must not declare columns — runtime infers from extract() return')
    })

    test(id, `[extract] must not have args.limit (runtime provides)`, () => {
      assert(!tap.args?.limit, 'extract-format must not declare args.limit — runtime provides default limit=20')
    })

    test(id, `[extract] must not have wait (runtime adaptive)`, () => {
      assert(tap.wait === undefined, 'extract-format must not declare wait — runtime uses adaptive retry')
    })

    // waitFor must be a string if present
    if (tap.waitFor !== undefined) {
      test(id, `[extract] waitFor is a string (CSS selector)`, () => {
        assert.equal(typeof tap.waitFor, 'string', 'waitFor must be a CSS selector string')
      })
    }

    // timeout must be a number if present
    if (tap.timeout !== undefined) {
      test(id, `[extract] timeout is a number`, () => {
        assert.equal(typeof tap.timeout, 'number', 'timeout must be a number (milliseconds)')
      })
    }
  }

  // ===== RUN-FORMAT CONSTRAINTS =====

  if (hasRun) {
    test(id, `[run] has columns (non-empty string array)`, () => {
      assert(Array.isArray(tap.columns),
        `run-format requires columns array — add columns: ["field1", "field2"] to ${id}`)
      assert(tap.columns.length > 0,
        `columns must not be empty — declare at least one column in ${id}`)
      for (const col of tap.columns) {
        assert.equal(typeof col, 'string', `column must be string, got ${typeof col}`)
      }
    })

    // Composition constraint: page.tap() references must resolve to existing taps
    const body = tap.run.toString()
    const tapCalls = [...body.matchAll(/page\.tap\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']/g)]
    for (const [, refSite, refName] of tapCalls) {
      test(id, `[composition] page.tap("${refSite}", "${refName}") references existing tap`, () => {
        const refPath = join(TAPS_DIR, refSite, `${refName}.tap.js`)
        const exists = existsSync(refPath)
        assert(exists,
          `${id} calls page.tap("${refSite}", "${refName}") but ${refSite}/${refName}.tap.js does not exist — composition will fail at runtime`)
      })
    }
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

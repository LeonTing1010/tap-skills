#!/usr/bin/env -S deno run -A
/**
 * doctor-badges: daily health check for showcase taps, writes the verdict
 * back to the taprun.dev presentation page.
 *
 * Flow:
 *   1. Discover every showcase/**\/*.tap.json in this repo.
 *   2. For each: convert plan → ~/.tap/taps/{site}/{name}.tap.js so
 *      tap CLI < v0.11.7 can read it (remove once CLI speaks plans).
 *   3. Run `tap doctor <site>/<name>` and parse the text verdict.
 *   4. Clone/update the public repo (LeonTing1010/tap) into ./public.
 *   5. For every tap whose verdict changed, patch the frontmatter of
 *      public/docs/taps/{site}/{name}.html in place
 *      (doctor_verdict + doctor_checked).
 *   6. Commit + push the batch to main.
 *
 * Required env:
 *   TAPRUN_WEB_TOKEN  — PAT with contents:write on LeonTing1010/tap
 *   GITHUB_ACTOR      — set by CI
 *
 * Run locally against a real checkout:
 *   TAPRUN_WEB_TOKEN=ghp_... deno run -A .github/scripts/doctor-badges.ts
 */

import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts"
import { dirname, join, relative } from "https://deno.land/std@0.224.0/path/mod.ts"

const HOME = Deno.env.get("HOME")!
const SKILLS_ROOT = Deno.env.get("SKILLS_ROOT") || Deno.cwd()
const PUBLIC_CLONE = Deno.env.get("PUBLIC_CLONE") || "./public"
const TOKEN = Deno.env.get("TAPRUN_WEB_TOKEN") || ""
const ACTOR = Deno.env.get("GITHUB_ACTOR") || "tap-ci"
const TODAY = new Date().toISOString().slice(0, 10)

type Verdict = "healthy" | "stale" | "broken" | "skipped" | "unknown"

interface TapRef { site: string; name: string; planPath: string }
interface DoctorResult { tap: TapRef; verdict: Verdict; detail: string }

async function run(cmd: string[], opts: { cwd?: string; env?: Record<string, string> } = {}): Promise<{ code: number; out: string; err: string }> {
  const p = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    cwd: opts.cwd,
    env: opts.env,
    stdout: "piped",
    stderr: "piped",
  })
  const r = await p.output()
  return {
    code: r.code,
    out: new TextDecoder().decode(r.stdout),
    err: new TextDecoder().decode(r.stderr),
  }
}

// ── 1. discover

async function discoverTaps(): Promise<TapRef[]> {
  const root = join(SKILLS_ROOT, "showcase")
  const refs: TapRef[] = []
  try {
    for await (const entry of walk(root, { exts: [".tap.json"], includeDirs: false })) {
      const rel = relative(root, entry.path) // site/name.tap.json
      const [site, file] = rel.split("/")
      if (!site || !file || !file.endsWith(".tap.json")) continue
      refs.push({ site, name: file.replace(/\.tap\.json$/, ""), planPath: entry.path })
    }
  } catch (e) {
    console.error(`walk failed: ${(e as Error).message}`)
  }
  return refs
}

// ── 2. convert to .tap.js and drop into ~/.tap/taps

async function stageTap(ref: TapRef): Promise<boolean> {
  const outDir = join(HOME, ".tap/taps", ref.site)
  await Deno.mkdir(outDir, { recursive: true })
  const converter = join(SKILLS_ROOT, ".github/scripts/plan-to-tapjs.ts")
  const r = await run(["deno", "run", "-A", converter, ref.planPath])
  if (r.code !== 0) {
    console.log(`  ⊘ ${ref.site}/${ref.name} — cannot convert (${r.err.trim().split("\n").at(-1)})`)
    return false
  }
  await Deno.writeTextFile(join(outDir, `${ref.name}.tap.js`), r.out)
  return true
}

// ── 3. run doctor

function parseDoctorLine(line: string): Verdict | null {
  // tap CLI output format:
  //   ✔ site/name    score=1.0  N rows (Nms)        → healthy
  //   ⚠ site/name    stale  — drift detected        → stale
  //   ✘ site/name    error  — Error: ...            → broken
  //   ⊘ site/name    skipped  — ...                  → skipped
  if (/^\s*✔/.test(line)) return "healthy"
  if (/^\s*⚠/.test(line)) return "stale"
  if (/^\s*✘/.test(line)) return "broken"
  if (/^\s*⊘/.test(line)) return "skipped"
  return null
}

async function checkTap(ref: TapRef): Promise<DoctorResult> {
  const id = `${ref.site}/${ref.name}`
  const r = await run(["tap", "doctor", id])
  let verdict: Verdict = "unknown"
  let detail = ""
  for (const line of r.out.split("\n")) {
    if (!line.includes(id)) continue
    const v = parseDoctorLine(line)
    if (v) {
      verdict = v
      detail = line.trim()
      break
    }
  }
  console.log(`  ${verdict === "healthy" ? "✓" : verdict === "broken" ? "✗" : "·"} ${id}: ${verdict}`)
  return { tap: ref, verdict, detail }
}

// ── 4. clone public repo

async function clonePublic(): Promise<string> {
  if (!TOKEN) throw new Error("TAPRUN_WEB_TOKEN env missing")
  try {
    await Deno.stat(PUBLIC_CLONE)
    // exists — pull latest
    await run(["git", "fetch", "origin", "main"], { cwd: PUBLIC_CLONE })
    await run(["git", "reset", "--hard", "origin/main"], { cwd: PUBLIC_CLONE })
    return PUBLIC_CLONE
  } catch { /* needs clone */ }
  const url = `https://${ACTOR}:${TOKEN}@github.com/LeonTing1010/tap.git`
  const r = await run(["git", "clone", "--depth", "1", "--branch", "main", url, PUBLIC_CLONE])
  if (r.code !== 0) throw new Error(`git clone failed: ${r.err}`)
  return PUBLIC_CLONE
}

// ── 5. patch frontmatter

async function patchFrontmatter(publicRoot: string, ref: TapRef, verdict: Verdict): Promise<boolean> {
  const path = join(publicRoot, "docs/taps", ref.site, `${ref.name}.html`)
  let src: string
  try { src = await Deno.readTextFile(path) }
  catch {
    console.log(`    ⊘ no presentation page at ${path}`)
    return false
  }

  const fmMatch = src.match(/^---\n([\s\S]*?)\n---\n/)
  if (!fmMatch) {
    console.log(`    ⊘ no frontmatter in ${path}`)
    return false
  }
  const fm = fmMatch[1]

  // idempotent: if verdict + checked already match, skip.
  const curVerdict = fm.match(/^doctor_verdict:\s*(\S+)/m)?.[1]
  const curChecked = fm.match(/^doctor_checked:\s*"?([^"\n]+)"?/m)?.[1]
  if (curVerdict === verdict && curChecked === TODAY) return false

  let newFm = fm
  if (newFm.match(/^doctor_verdict:/m)) {
    newFm = newFm.replace(/^doctor_verdict:.*$/m, `doctor_verdict: ${verdict}`)
  } else {
    newFm = newFm.trim() + `\ndoctor_verdict: ${verdict}`
  }
  if (newFm.match(/^doctor_checked:/m)) {
    newFm = newFm.replace(/^doctor_checked:.*$/m, `doctor_checked: "${TODAY}"`)
  } else {
    newFm = newFm.trim() + `\ndoctor_checked: "${TODAY}"`
  }

  const out = src.replace(fmMatch[0], `---\n${newFm}\n---\n`)
  await Deno.writeTextFile(path, out)
  return true
}

// ── 6. commit + push

async function commitAndPush(publicRoot: string, changed: number) {
  if (changed === 0) {
    console.log("no frontmatter changes — skipping commit")
    return
  }
  await run(["git", "config", "user.name", "tap-doctor-ci"], { cwd: publicRoot })
  await run(["git", "config", "user.email", "doctor-ci@taprun.dev"], { cwd: publicRoot })
  await run(["git", "add", "docs/taps"], { cwd: publicRoot })
  const msg = `ci(doctor): refresh badges (${changed} taps) ${TODAY}`
  const c = await run(["git", "commit", "-m", msg], { cwd: publicRoot })
  if (c.code !== 0) {
    console.log(`nothing to commit: ${c.err}`)
    return
  }
  const p = await run(["git", "push", "origin", "main"], { cwd: publicRoot })
  if (p.code !== 0) throw new Error(`push failed: ${p.err}`)
  console.log(`✓ pushed ${changed} badge update(s)`)
}

// ── main

const refs = await discoverTaps()
console.log(`discovered ${refs.length} .tap.json in showcase/`)
if (refs.length === 0) Deno.exit(0)

const results: DoctorResult[] = []
for (const ref of refs) {
  if (!(await stageTap(ref))) {
    results.push({ tap: ref, verdict: "unknown", detail: "staging skipped" })
    continue
  }
  results.push(await checkTap(ref))
}

const publicRoot = await clonePublic()
let changed = 0
for (const r of results) {
  if (r.verdict === "unknown") continue
  if (await patchFrontmatter(publicRoot, r.tap, r.verdict)) changed++
}
await commitAndPush(publicRoot, changed)

// Summary
const counts: Record<string, number> = {}
for (const r of results) counts[r.verdict] = (counts[r.verdict] || 0) + 1
console.log(`\nsummary:`, counts)

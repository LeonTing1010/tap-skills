#!/usr/bin/env -S deno run -A
/**
 * Convert a .tap.json (W3C Annotation / ExecutionPlan) to a .tap.js ES
 * module so that tap CLI < v0.11.7 can read it. Transitional until the
 * CLI's findTap reads .tap.json natively (fix in tap-core 2026-04-20).
 *
 * Usage: deno run -A plan-to-tapjs.ts path/to/tap.json > out.tap.js
 *
 * Behavior: extracts body.{site,name,description,intent,columns,args,health}
 * and concatenates the function sources from body.ops[*] where op==="exec".
 * Plans with pure-structural ops (no exec) are skipped (CLI can't run them
 * until it speaks plans directly).
 */

if (Deno.args.length !== 1) {
  console.error("usage: plan-to-tapjs.ts <tap.json>")
  Deno.exit(1)
}

const plan = JSON.parse(await Deno.readTextFile(Deno.args[0]))
const body = plan?.body
if (!body || body.type !== "tap:ExecutionPlan") {
  console.error("not a tap:ExecutionPlan")
  Deno.exit(2)
}

const site = body.site
const name = body.name
const description = body.description || ""
const intent = body.intent || "read"
const columns = body.columns || []
const args = body.args || {}
const health = body.health || {}

const execFns: string[] = []
for (const op of body.ops || []) {
  if (op?.op === "exec" && typeof op.fn === "string") execFns.push(op.fn)
}
if (execFns.length === 0) {
  console.error(`${site}/${name}: no exec op — pure-structural plans need v0.11.7+ CLI`)
  Deno.exit(3)
}

// Strip `async function(...)` preamble from each fn and stitch into a
// single tap body. If multiple execs: run sequentially, last wins.
function extractBody(fnSrc: string): string {
  const m = fnSrc.match(/^\s*async\s+function\s*\([^)]*\)\s*\{([\s\S]*)\}\s*$/)
  return m ? m[1] : fnSrc
}
const bodyText = execFns.length === 1
  ? extractBody(execFns[0])
  : execFns.map(extractBody).join("\n  // --- next exec op ---\n")

const js = `// AUTO-GENERATED from ${Deno.args[0]}
// Source of truth: ${site}/${name}.tap.json (W3C Annotation).
// Regenerate via tap-skills/.github/scripts/plan-to-tapjs.ts.
// DO NOT EDIT BY HAND.

export default {
  site: ${JSON.stringify(site)},
  name: ${JSON.stringify(name)},
  intent: ${JSON.stringify(intent)},
  description: ${JSON.stringify(description)},
  columns: ${JSON.stringify(columns)},
  args: ${JSON.stringify(args, null, 2)},
  health: ${JSON.stringify(health)},
  examples: [{}],

  async tap(tap, args) {${bodyText}
  }
}
`

console.log(js)

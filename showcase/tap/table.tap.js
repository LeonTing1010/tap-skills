export default {
  site: "tap",
  name: "table",
  intent: "read",
  description: "Format rows as a human-readable table (outputs one row per line)",
  args: {
    cols: { type: "string", default: "", description: "Columns to show (comma-separated, default: all)" },
    max: { type: "string", default: "40", description: "Max column width" },
  },

  async tap(handle, args) {
    const rows = args.rows || [];
    if (rows.length === 0) return [{ line: "(no rows)" }]
    const maxW = parseInt(args.max) || 40
    const cols = args.cols ? String(args.cols).split(",").map(s => s.trim()) : Object.keys(rows[0])
    const widths = cols.map(c => Math.min(maxW, Math.max(c.length, ...rows.map(r => String(r[c] || "").length))))
    const pad = (s, w) => { s = String(s); return s.length > w ? s.slice(0, w - 1) + "…" : s.padEnd(w) }
    const sep = "  "
    const lines = []
    lines.push({ line: cols.map((c, i) => pad(c, widths[i])).join(sep) })
    lines.push({ line: cols.map((_, i) => "─".repeat(widths[i])).join(sep) })
    for (const r of rows) {
      lines.push({ line: cols.map((c, i) => pad(r[c] || "", widths[i])).join(sep) })
    }
    return lines
  },
}

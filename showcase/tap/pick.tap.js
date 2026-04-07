export default {
  site: "tap",
  name: "pick",
  intent: "read",
  description: "Select specific columns from rows (projection)",
  args: {
    fields: { type: "string", description: "Comma-separated column names to keep" },
  },

  async tap(handle, args) {
    const rows = args.rows || [];
    const keys = String(args.fields).split(",").map(s => s.trim()).filter(Boolean)
    return rows.map(r => {
      const out = {}
      for (const k of keys) { if (k in r) out[k] = r[k] }
      return out
    })
  }
}

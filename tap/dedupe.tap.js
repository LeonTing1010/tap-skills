export default {
  site: "tap",
  name: "dedupe",
  intent: "read",
  description: "Remove duplicate rows by field value",
  args: {
    field: { type: "string", description: "Column name to deduplicate on" },
  },

  async tap(handle, args) {
    const rows = args.rows || [];
    const seen = new Set()
    return rows.filter(r => {
      const key = String(r[args.field] ?? JSON.stringify(r))
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
}

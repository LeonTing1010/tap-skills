export default {
  site: "tap",
  name: "dedupe",
  description: "Remove duplicate rows by field value",
  args: {
    field: { type: "string", description: "Column name to deduplicate on" },
  },

  transform(rows, args) {
    const seen = new Set()
    return rows.filter(r => {
      const key = String(r[args.field] ?? JSON.stringify(r))
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
}

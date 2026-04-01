export default {
  site: "tap",
  name: "filter",
  description: "Filter rows where field matches condition (gt, lt, eq, contains)",
  args: {
    field: { type: "string", description: "Column name to filter on" },
    gt: { type: "number", description: "Greater than (numeric)" },
    lt: { type: "number", description: "Less than (numeric)" },
    eq: { type: "string", description: "Equals (exact match)" },
    contains: { type: "string", description: "Contains substring" },
  },

  transform(rows, args) {
    return rows.filter(r => {
      const v = r[args.field]
      if (args.gt !== undefined) return Number(v) > Number(args.gt)
      if (args.lt !== undefined) return Number(v) < Number(args.lt)
      if (args.eq !== undefined) return String(v) === String(args.eq)
      if (args.contains !== undefined) return String(v).includes(String(args.contains))
      return true
    })
  }
}

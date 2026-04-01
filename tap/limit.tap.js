export default {
  site: "tap",
  name: "limit",
  description: "Take first N rows (head) or skip M then take N (offset+limit)",
  args: {
    n: { type: "number", default: 10, description: "Number of rows to take" },
    offset: { type: "number", default: 0, description: "Rows to skip before taking" },
  },

  transform(rows, args) {
    const offset = Number(args.offset) || 0
    const n = Number(args.n) || 10
    return rows.slice(offset, offset + n)
  }
}

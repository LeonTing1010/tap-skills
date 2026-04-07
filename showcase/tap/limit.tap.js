export default {
  site: "tap",
  name: "limit",
  intent: "read",
  description: "Take first N rows (head) or skip M then take N (offset+limit)",
  args: {
    n: { type: "number", default: 10, description: "Number of rows to take" },
    offset: { type: "number", default: 0, description: "Rows to skip before taking" },
  },

  async tap(handle, args) {
    const rows = args.rows || [];
    const offset = Number(args.offset) || 0
    const n = Number(args.n) || 10
    return rows.slice(offset, offset + n)
  }
}

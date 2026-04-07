export default {
  site: "jimeng",
  name: "history",
  intent: "read",
  description: "Jimeng AI task history (requires local dreamina CLI)",
  columns: ["submit_id", "status", "type", "created_at"],
  health: { min_rows: 1 },
  args: {
    status: { type: "string", default: "" },
    limit: { type: "string", default: "10" },
  },

  tap: async (tap, args) => {
    const data = await tap.fetch("https://jimeng.jianying.com/ai-tool/api/v1/task/list?limit=" + (args.limit || 10))
    if (!data?.data?.list) return [{ submit_id: "error", status: "API requires login", type: "", created_at: "" }]
    return data.data.list.map(t => ({
      submit_id: String(t.submit_id || ""),
      status: String(t.status || ""),
      type: String(t.type || ""),
      created_at: String(t.created_at || ""),
    }))
  },
}

export default {
  site: "scys",
  name: "input-keyword",
  intent: "write",
  description: "Input search keyword into SCYS search box (requires login)",
  columns: ["status", "selector"],
  args: {
    keyword: { type: "string", description: "Search keyword", required: true }
  },

  async tap(tap, args) {
    const keyword = String(args.keyword || "")
    if (!keyword) {
      return [{ status: "error", selector: "keyword required" }]
    }

    const selector = 'input[placeholder="搜索内容、用户、航海..."]'
    await tap.type(selector, keyword)
    await tap.wait(500)

    return [{ status: "ok", selector }]
  }
}

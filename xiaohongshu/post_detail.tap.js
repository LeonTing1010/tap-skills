export default {
  site: "xiaohongshu",
  name: "post_detail",
  description: "Search, click, extract post detail and comments (SSR)",
  columns: ["type", "content", "likes", "author"],
  args: {
    keyword: { type: "string" },
    index: { type: "int", default: 1 }
  },
  health: { min_rows: 1, non_empty: ["content"] },

  async run(tap, args) {
    // Compose: open note → read detail
    await tap.run("xiaohongshu", "open", { keyword: args.keyword, index: args.index })
    return await tap.run("xiaohongshu", "detail")
  }
}

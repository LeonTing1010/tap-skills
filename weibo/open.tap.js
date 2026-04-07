export default {
  site: "weibo",
  name: "open",
  intent: "read",
  description: "Search and open Nth Weibo post",
  columns: ["mid", "title", "author", "url"],
  args: {
    keyword: { type: "string" },
    index: { type: "int", default: 1 }
  },

  async tap(tap, args) {
    // Compose: use search tap to get results
    const results = await tap.run("weibo", "search", { keyword: args.keyword })
    const idx = (args.index || 1) - 1
    if (!results || !results[idx]) {
      return [{ mid: "", title: "no result at index " + (idx + 1), author: "", url: "" }]
    }

    const target = results[idx]
    const url = target.url || ""
    if (!url) {
      return [{ mid: "", title: "no url for result", author: target.author || "", url: "" }]
    }

    // Extract mid from URL: weibo.com/{uid}/{bid}
    const bid = url.split("/").pop() || ""

    // Navigate to mobile detail page for easier extraction
    await tap.nav("https://m.weibo.cn/detail/" + bid)
    await tap.wait(2000)

    return [{
      mid: bid,
      title: (target.title || "").substring(0, 120),
      author: target.author || "",
      url: url
    }]
  }
}

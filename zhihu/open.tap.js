export default {
  site: "zhihu",
  name: "open",
  intent: "read",
  description: "Search and open Nth Zhihu question",
  columns: ["qid", "title", "author", "url"],
  args: {
    keyword: { type: "string" },
    index: { type: "int", default: 1 }
  },

  async tap(tap, args) {
    // Compose: use search tap to get results
    const results = await tap.run("zhihu", "search", { keyword: args.keyword })
    const idx = (args.index || 1) - 1
    if (!results || !results[idx]) {
      return [{ qid: "", title: "no result at index " + (idx + 1), author: "", url: "" }]
    }

    const target = results[idx]
    let url = target.url || ""
    if (!url) {
      return [{ qid: "", title: "no url for result", author: target.author || "", url: "" }]
    }

    // Extract question id from URL
    const qidMatch = url.match(/question\/(\d+)/)
    const qid = qidMatch ? qidMatch[1] : ""

    // Navigate to the question page
    await tap.nav(url)
    await tap.wait(2000)

    return [{
      qid: qid,
      title: (target.title || "").substring(0, 120),
      author: target.author || "",
      url: url
    }]
  }
}

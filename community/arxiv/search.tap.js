export default {
  site: "arxiv",
  name: "search",
  intent: "read",
  description: "Search arXiv papers",
  args: { keyword: { type: "string" } },
  examples: [{ keyword: "large language model" }],
  health: { min_rows: 3, non_empty: ["title"] },

  tap: async (tap, args) => {
    const params = new URLSearchParams({
      search_query: "all:" + args.keyword,
      start: "0",
      max_results: "20",
      sortBy: "relevance",
      sortOrder: "descending",
    })
    // responseType: "text" because arXiv returns Atom XML
    const xml = await tap.fetch(
      "https://export.arxiv.org/api/query?" + params.toString(),
      { responseType: "text" },
    )
    // Parse Atom XML entries with regex (no DOMParser in executor context)
    const entries = String(xml).match(/<entry>([\s\S]*?)<\/entry>/g) || []
    return entries.map((entry, i) => {
      const get = tag => {
        const m = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
        return m ? m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : ""
      }
      const authors = [...entry.matchAll(/<name>([\s\S]*?)<\/name>/g)]
        .map(m => m[1].trim()).join(", ")
      return {
        rank: String(i + 1),
        title: get("title"),
        authors,
        published: get("published").split("T")[0],
        abstract: get("summary").substring(0, 300),
        url: get("id"),
      }
    })
  },
}

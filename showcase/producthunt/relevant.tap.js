export default {
  site: "producthunt",
  name: "relevant",
  intent: "read",
  description: "Find recent PH launches matching keywords. L1 source: PH Atom feed /feed parsed via page-context fetch.",
  columns: ["rank", "title", "tagline", "maker", "published", "url"],
  args: {
    keywords: {
      type: "string",
      default: "agent,automation,workflow,mcp,browser,scraper,cli,devtool,prompt,llm,coding,copilot",
      description: "Comma-separated keywords; matches against title+tagline case-insensitive. Empty string = no filter.",
    },
    limit: { type: "int", default: 20 },
  },
  health: { min_rows: 3, non_empty: ["title", "url"] },
  examples: [{ limit: 10 }],

  async tap(tap, args) {
    const limit = args.limit || 20
    const rawKws = args.keywords == null
      ? "agent,automation,workflow,mcp,browser,scraper,cli,devtool,prompt,llm,coding,copilot"
      : args.keywords
    const kws = rawKws.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)

    await tap.nav("https://www.producthunt.com/")
    await tap.wait(400)

    const entries = await tap.eval(async () => {
      const r = await fetch("/feed", { credentials: "include" })
      const xml = await r.text()
      const decode = (s) => {
        const t = document.createElement("textarea")
        t.innerHTML = s
        return t.value
      }
      const doc = new DOMParser().parseFromString(xml, "application/xml")
      const items = Array.from(doc.querySelectorAll("entry"))
      return items.map((e) => {
        const title = (e.querySelector("title") && e.querySelector("title").textContent || "").trim()
        let link = ""
        for (const l of e.querySelectorAll("link")) {
          const rel = l.getAttribute("rel") || "alternate"
          if (rel === "alternate") {
            link = l.getAttribute("href") || ""
            break
          }
        }
        const published = (e.querySelector("published") && e.querySelector("published").textContent || "").trim()
        const author = e.querySelector("author")
        const maker = (author && author.querySelector("name") && author.querySelector("name").textContent || "").trim()
        const contentRaw = (e.querySelector("content") && e.querySelector("content").textContent || "")
        const html = decode(contentRaw)
        const doc2 = new DOMParser().parseFromString("<div>" + html + "</div>", "text/html")
        const firstP = (doc2.querySelector("p") && doc2.querySelector("p").textContent || "").trim()
        return { title, url: link, published, maker, tagline: firstP }
      })
    })

    const filtered = kws.length === 0 ? entries : entries.filter((e) => {
      if (!e.title || !e.url) return false
      const hay = (e.title + " " + (e.tagline || "")).toLowerCase()
      return kws.some((k) => hay.includes(k))
    })

    return filtered.slice(0, limit).map((e, i) => ({
      rank: String(i + 1),
      title: e.title,
      tagline: (e.tagline || "").slice(0, 200),
      maker: e.maker || "",
      published: (e.published || "").slice(0, 10),
      url: e.url,
    }))
  },
}

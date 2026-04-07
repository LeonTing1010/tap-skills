export default {
  site: "x",
  name: "opportunities",
  intent: "read",
  description: "Find X conversations to engage with — search multiple keywords and return recent posts worth replying to",
  args: [
    { name: "keywords", type: "string", description: "Comma-separated keywords (default: browser automation, MCP, web scraping)", default: "browser automation agent,MCP server tool,web scraping broken,AI agent cost" }
  ],
  columns: ["keyword", "author", "handle", "text", "time", "url"],
  async tap(tap, args) {
    const keywords = (args.keywords || "browser automation agent,MCP server tool,web scraping broken").split(",").map(k => k.trim())
    const results = []
    
    for (const kw of keywords) {
      const url = "https://x.com/search?q=" + encodeURIComponent(kw) + "&src=typed_query&f=live"
      await tap.nav(url)
      await tap.wait(3000)
      
      const posts = await tap.eval((keyword) => {
        return Array.from(document.querySelectorAll('[data-testid="tweet"]')).slice(0, 5).map(el => {
          const userEl = el.querySelector('[data-testid="User-Name"]')
          const spans = userEl ? Array.from(userEl.querySelectorAll("span")) : []
          let author = "", handle = ""
          for (const s of spans) {
            const t = (s.textContent || "").trim()
            if (t.startsWith("@")) { handle = t; break }
            if (t && !t.includes("·") && !author) author = t
          }
          const textEl = el.querySelector('[data-testid="tweetText"]')
          const text = textEl ? textEl.textContent.trim().substring(0, 200) : ""
          const timeEl = el.querySelector("time")
          const linkEl = el.querySelector('a[href*="/status/"]')
          return {
            keyword,
            author,
            handle,
            text,
            time: timeEl ? timeEl.getAttribute("datetime") || "" : "",
            url: linkEl ? "https://x.com" + linkEl.getAttribute("href") : ""
          }
        }).filter(p => p.text.length > 20)
      }, kw)
      
      results.push(...posts)
    }
    return results
  }
}
export default {
  site: "tiktok",
  name: "trending",
  intent: "read",
  description: "TikTok Trending Videos (requires login or geo-access)",
  url: "https://www.tiktok.com/explore",
  health: { min_rows: 3, non_empty: ["author"], requires_auth: true },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = (args) => {
    const items = []
    const seen = new Set()
    for (const a of document.querySelectorAll('a[href*="/video/"]')) {
      const href = a.href
      if (seen.has(href)) continue
      seen.add(href)
      const match = href.match(/@([^/]+)/)
      const author = match ? match[1] : ""
      items.push({
        rank: String(items.length + 1),
        author,
        views: (a.textContent || "").trim() || "0",
        url: href,
      })
    }
    return items
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  },
}

export default {
  site: "tiktok",
  name: "trending",
  intent: "read",
  description: "TikTok Trending Videos",
  url: "https://www.tiktok.com/explore",
  health: { min_rows: 3, non_empty: ["author"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = (args) => {
    const links = document.querySelectorAll('a[href*="/video/"]')
    const items = []
    const seen = new Set()
    for (const a of links) {
      const href = a.href
      if (seen.has(href)) continue
      seen.add(href)
      const match = href.match(/@([^/]+)/)
      const author = match ? match[1] : ''
      const views = a.textContent.trim()
      items.push({
        rank: String(items.length + 1),
        author: author,
        views: views || '0',
        url: href
      })
    }
    return items
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

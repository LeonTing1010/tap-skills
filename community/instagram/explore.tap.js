export default {
  site: "instagram",
  name: "explore",
  intent: "read",
  description: "Instagram Explore (requires login)",
  url: "https://www.instagram.com/explore/",
  health: { min_rows: 3, non_empty: ["caption"], requires_auth: true },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = (args) => {
    const items = []
    const seen = new Set()
    for (const a of document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]')) {
      const href = a.href
      if (seen.has(href)) continue
      seen.add(href)
      const img = a.querySelector("img")
      const caption = img ? (img.alt || "").trim() : ""
      items.push({
        rank: String(items.length + 1),
        caption: caption.substring(0, 200),
        author: "",
        likes: "0",
      })
    }
    return items
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  },
}

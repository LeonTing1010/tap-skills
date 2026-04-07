export default {
  site: "instagram",
  name: "explore",
  intent: "read",
  description: "Instagram Explore",
  url: "https://www.instagram.com/explore/",
  health: { min_rows: 3, non_empty: ["caption"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = (args) => {
    const items = []
    const posts = document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]')
    const seen = new Set()
    for (const a of posts) {
      const href = a.href
      if (seen.has(href)) continue
      seen.add(href)
      const img = a.querySelector('img')
      const caption = img ? (img.alt || '').trim() : ''
      const likeEl = a.querySelector('[class*="like"], span')
      const likes = likeEl ? likeEl.textContent.trim() : '0'
      items.push({
        rank: String(items.length + 1),
        caption: caption.substring(0, 200),
        author: '',
        likes: likes
      })
    }
    return items
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

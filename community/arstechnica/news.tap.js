export default {
  site: "arstechnica",
  name: "news",
  intent: "read",
  description: "Ars Technica latest tech news and articles",
  url: "https://arstechnica.com/",
  columns: ["title", "author", "comments", "link"],
  health: { min_rows: 5, non_empty: ["title", "link"] },
  examples: [{}],
  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = (args) => {
    const seen = new Set()
    const items = []
    document.querySelectorAll('article').forEach(el => {
      const titleEl = el.querySelector('h2 a') || el.querySelector('h2')
      const title = titleEl?.textContent?.trim() || ''
      if (!title || title.length < 10 || seen.has(title)) return
      seen.add(title)
      const link = el.querySelector('h2 a')?.href || el.querySelector('a')?.href || ''
      if (!link || !link.includes('arstechnica.com/')) return
      const byline = el.querySelector('div.font-impact')
      const author = byline?.querySelector('span:not([class])')?.textContent?.trim() || ''
      const comments = el.querySelector('a.view-comments')?.textContent?.trim()?.replace(/[^\d]/g, '') || '0'
      items.push({ title: String(title), author: String(author), comments: String(comments), link: String(link) })
    })
    return items.slice(0, 30)
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

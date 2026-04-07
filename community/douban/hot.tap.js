export default {
  site: "douban",
  name: "hot",
  intent: "read",
  description: "Douban trending movies",
  url: "https://movie.douban.com",
  health: { min_rows: 5, non_empty: ["title"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch('https://movie.douban.com/j/search_subjects?type=movie&tag=%E7%83%AD%E9%97%A8&page_limit=50&page_start=0')
    const data = await res.json()
    return data.subjects.map((m, i) => ({
      rank: String(i + 1),
      title: m.title,
      rate: m.rate || '-'
    }))
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

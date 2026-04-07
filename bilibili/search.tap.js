export default {
  site: "bilibili",
  name: "search",
  intent: "read",
  description: "Search Bilibili videos (API)",
  url: "https://www.bilibili.com",
  args: {
    keyword: { type: "string" }
  },
  health: { min_rows: 3, non_empty: ["title"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch(
      `https://api.bilibili.com/x/web-interface/wbi/search/type?search_type=video&keyword=${encodeURIComponent(args.keyword)}`,
      { credentials: 'include' }
    )
    const data = await res.json()
    const results = data?.data?.result || []
    return results.map(v => ({
      title: String(v.title || '').replace(/<[^>]*>/g, ''),
      author: String(v.author || ''),
      views: String(v.play || 0),
      likes: String(v.like || 0),
      bvid: String(v.bvid || ''),
      url: 'https://www.bilibili.com/video/' + (v.bvid || '')
    })).filter(v => v.title.length > 0)
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

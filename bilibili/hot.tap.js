export default {
  site: "bilibili",
  name: "hot",
  intent: "read",
  description: "Bilibili trending videos",
  url: "https://www.bilibili.com",
  health: { min_rows: 5, non_empty: ["title"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch('https://api.bilibili.com/x/web-interface/ranking/v2', { credentials: 'include' })
    const data = await res.json()
    return data.data.list.map(v => ({
      title: v.title,
      author: v.owner.name,
      views: String(v.stat.view),
      url: 'https://bilibili.com/video/' + v.bvid
    }))
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

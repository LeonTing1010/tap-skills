export default {
  site: "v2ex",
  name: "hot",
  intent: "read",
  description: "V2EX hot topics",
  url: "https://www.v2ex.com",
  health: { min_rows: 5, non_empty: ["title"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch("https://www.v2ex.com/api/topics/hot.json", { credentials: 'include' })
    const data = await res.json()
    return data.map(item => ({
      title: String(item.title || ''),
      node: String((item.node && item.node.title) || ''),
      replies: String(item.replies || 0)
    }))
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

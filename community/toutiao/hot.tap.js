export default {
  site: "toutiao",
  name: "hot",
  intent: "read",
  description: "Toutiao hot topics",
  url: "https://www.toutiao.com",

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch('https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc')
    const data = await res.json()
    return (data.data || []).map((item, i) => ({
      rank: String(i + 1),
      title: item.Title || '',
      hot: String(item.HotValue || 0)
    }))
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

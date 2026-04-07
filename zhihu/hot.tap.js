export default {
  site: "zhihu",
  name: "hot",
  intent: "read",
  description: "Zhihu hot topics",
  url: "https://www.zhihu.com",

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch('https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=50')
    const data = await res.json()
    return data.data.map((item, i) => ({
      rank: String(i + 1),
      title: item.target.title,
      heat: item.detail_text || ''
    }))
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

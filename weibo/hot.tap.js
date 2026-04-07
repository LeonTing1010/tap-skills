export default {
  site: "weibo",
  name: "hot",
  intent: "read",
  description: "Weibo hot search trending topics",
  url: "https://weibo.com",

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch('https://weibo.com/ajax/side/hotSearch')
    const data = await res.json()
    return data.data.realtime.map((item, i) => ({
      rank: i + 1,
      title: item.note,
      hot: item.num || 0
    }))
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

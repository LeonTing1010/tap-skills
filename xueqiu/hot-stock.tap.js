export default {
  site: "xueqiu",
  name: "hot-stock",
  intent: "read",
  description: "Xueqiu hot stocks",
  url: "https://xueqiu.com",

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch('https://stock.xueqiu.com/v5/stock/hot_stock/list.json?size=50&_type=10&type=10', { credentials: 'include' })
    const data = await res.json()
    return (data.data.items || []).map((s, i) => ({
      rank: String(i + 1),
      title: String(s.name || ''),
      code: String(s.code || ''),
      percent: (s.percent >= 0 ? '+' : '') + s.percent.toFixed(2) + '%'
    }))
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

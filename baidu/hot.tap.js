export default {
  site: "baidu",
  name: "hot",
  intent: "read",
  description: "Baidu hot search rankings",
  url: "https://www.baidu.com",
  health: { min_rows: 5, non_empty: ["title"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch('https://top.baidu.com/api/board?platform=wise&tab=realtime')
    const data = await res.json()
    const list = (data.data && data.data.cards && data.data.cards[0] && data.data.cards[0].content) || []
    return list.map((item, i) => ({
      rank: String(i + 1),
      title: item.word || item.query || '',
      hot: String(item.hotScore || 0)
    }))
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

export default {
  site: "douyin",
  name: "hot",
  intent: "read",
  description: "Douyin hot search rankings",
  url: "https://www.douyin.com",
  health: { min_rows: 5, non_empty: ["title"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch('https://www.douyin.com/aweme/v1/web/hot/search/list/', { credentials: 'include' })
    const data = await res.json()
    if (data.data && data.data.word_list) {
      return data.data.word_list.map((item, i) => ({
        rank: String(i + 1),
        title: item.word,
        hot: String(item.hot_value || 0)
      }))
    }
    return [{ rank: '1', title: 'API requires login — visit douyin.com first', hot: '0' }]
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

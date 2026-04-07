export default {
  site: "juejin",
  name: "hot",
  intent: "read",
  description: "Juejin trending articles",
  url: "https://juejin.cn",

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch('https://api.juejin.cn/content_api/v1/content/article_rank?category_id=1&type=hot&count=50', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    })
    const data = await res.json()
    return (data.data || []).map(item => ({
      title: String(item.content.title || ''),
      views: String(item.content.display_count || 0),
      author: String(item.author.name || '-')
    }))
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

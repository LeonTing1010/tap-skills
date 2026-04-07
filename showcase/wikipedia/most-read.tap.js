export default {
  site: "wikipedia",
  name: "most-read",
  intent: "read",
  description: "Wikipedia most read articles today",
  url: "https://en.wikipedia.org",

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const d = new Date()
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const day = d.getDate() - 1
    const url = `https://en.wikipedia.org/api/rest_v1/feed/featured/${y}/${String(m).padStart(2, '0')}/${String(day).padStart(2, '0')}`
    const res = await fetch(url)
    const data = await res.json()
    return (data.mostread?.articles || []).map(a => ({
      title: String(a.titles?.normalized || a.title),
      description: String(a.description || '-'),
      views: String(a.views || 0)
    }))
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

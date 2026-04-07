export default {
  site: "devto",
  name: "top",
  intent: "read",
  description: "Dev.to top articles",
  url: "https://dev.to",
  health: { min_rows: 5, non_empty: ["title"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch("https://dev.to/api/articles?per_page=50&state=rising", { credentials: 'include' })
    const data = await res.json()
    return data.map(item => ({
      title: item.title,
      reactions: String(item.positive_reactions_count),
      comments: String(item.comments_count),
      author: item.user.name
    }))
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

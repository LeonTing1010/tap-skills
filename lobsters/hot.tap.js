export default {
  site: "lobsters",
  name: "hot",
  intent: "read",
  description: "Lobsters hot posts",
  url: "https://lobste.rs",
  health: { min_rows: 5, non_empty: ["title"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch('https://lobste.rs/hottest.json')
    const data = await res.json()
    return data.map((t, i) => ({
      rank: String(i + 1),
      title: t.title,
      score: String(t.score),
      tags: t.tags.join(', '),
      comments: String(t.comment_count)
    }))
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

export default {
  site: "stackoverflow",
  name: "hot",
  intent: "read",
  description: "StackOverflow hot questions",
  url: "https://stackoverflow.com",
  health: { min_rows: 5, non_empty: ["title"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch('https://api.stackexchange.com/2.3/questions?order=desc&sort=hot&site=stackoverflow&pagesize=50')
    const data = await res.json()
    return data.items.map((q, i) => ({
      rank: String(i + 1),
      title: q.title,
      score: String(q.score),
      answers: String(q.answer_count),
      tags: q.tags.join(', ')
    }))
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

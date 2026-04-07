export default {
  site: "lobsters",
  name: "hot",
  intent: "read",
  description: "Lobsters hot posts",
  health: { min_rows: 5, non_empty: ["title"] },

  async tap(handle, _args) {
    const data = await handle.fetch("https://lobste.rs/hottest.json");
    return data.map((t, i) => ({
      rank: String(i + 1),
      title: t.title,
      score: String(t.score),
      tags: t.tags.join(", "),
      comments: String(t.comment_count),
    }));
  },
}

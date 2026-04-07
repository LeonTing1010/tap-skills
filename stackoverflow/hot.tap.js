export default {
  site: "stackoverflow",
  name: "hot",
  intent: "read",
  description: "StackOverflow hot questions",
  health: { min_rows: 5, non_empty: ["title"] },

  async tap(handle, _args) {
    const data = await handle.fetch(
      "https://api.stackexchange.com/2.3/questions?order=desc&sort=hot&site=stackoverflow&pagesize=50",
    );
    return data.items.map((q, i) => ({
      rank: String(i + 1),
      title: q.title,
      score: String(q.score),
      answers: String(q.answer_count),
      tags: q.tags.join(", "),
    }));
  },
}

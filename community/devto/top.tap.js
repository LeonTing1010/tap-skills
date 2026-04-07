export default {
  site: "devto",
  name: "top",
  intent: "read",
  description: "Dev.to top articles",
  health: { min_rows: 5, non_empty: ["title"] },

  async tap(handle, _args) {
    const data = await handle.fetch(
      "https://dev.to/api/articles?per_page=50&state=rising",
    );
    return data.map(item => ({
      title: item.title,
      reactions: String(item.positive_reactions_count),
      comments: String(item.comments_count),
      author: item.user.name,
    }));
  },
}

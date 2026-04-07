export default {
  site: "juejin",
  name: "hot",
  intent: "read",
  description: "Juejin trending articles",
  health: { min_rows: 5, non_empty: ["title"] },

  async tap(handle, _args) {
    const data = await handle.fetch(
      "https://api.juejin.cn/content_api/v1/content/article_rank?category_id=1&type=hot&count=50",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      },
    );
    return (data.data || []).map(item => ({
      title: String(item.content.title || ""),
      views: String(item.content.display_count || 0),
      author: String(item.author.name || "-"),
    }));
  },
}

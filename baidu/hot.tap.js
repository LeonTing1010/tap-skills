export default {
  site: "baidu",
  name: "hot",
  intent: "read",
  description: "Baidu hot search rankings",
  health: { min_rows: 5, non_empty: ["title"] },

  async tap(handle, _args) {
    const data = await handle.fetch(
      "https://top.baidu.com/api/board?platform=wise&tab=realtime",
      { headers: { "Referer": "https://top.baidu.com/" } },
    );
    const list = data.data?.cards?.[0]?.content || [];
    return list.map((item, i) => ({
      rank: String(i + 1),
      title: item.word || item.query || "",
      hot: String(item.hotScore || 0),
    }));
  },
}

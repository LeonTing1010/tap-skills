export default {
  site: "weibo",
  name: "hot",
  intent: "read",
  description: "Weibo hot search trending topics",
  health: { min_rows: 10, non_empty: ["title"] },

  async tap(handle, _args) {
    const data = await handle.fetch("https://weibo.com/ajax/side/hotSearch", {
      headers: {
        "Referer": "https://weibo.com/",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });
    return data.data.realtime.map((item, i) => ({
      rank: i + 1,
      title: item.note,
      hot: item.num || 0,
    }));
  },
}

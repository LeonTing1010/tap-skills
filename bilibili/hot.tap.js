export default {
  site: "bilibili",
  name: "hot",
  intent: "read",
  description: "Bilibili trending videos",
  health: { min_rows: 5, non_empty: ["title"] },

  async tap(handle, _args) {
    const data = await handle.fetch(
      "https://api.bilibili.com/x/web-interface/ranking/v2",
    );
    return data.data.list.map(v => ({
      title: v.title,
      author: v.owner.name,
      views: String(v.stat.view),
      url: "https://bilibili.com/video/" + v.bvid,
    }));
  },
}

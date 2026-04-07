export default {
  site: "bilibili",
  name: "search",
  intent: "read",
  description: "Search Bilibili videos (API)",
  args: { keyword: { type: "string" } },
  health: { min_rows: 3, non_empty: ["title"] },

  async tap(handle, args) {
    const data = await handle.fetch(
      `https://api.bilibili.com/x/web-interface/wbi/search/type?search_type=video&keyword=${encodeURIComponent(args.keyword)}`,
    );
    const results = data?.data?.result || [];
    return results.map(v => ({
      title: String(v.title || "").replace(/<[^>]*>/g, ""),
      author: String(v.author || ""),
      views: String(v.play || 0),
      likes: String(v.like || 0),
      bvid: String(v.bvid || ""),
      url: "https://www.bilibili.com/video/" + (v.bvid || ""),
    })).filter(v => v.title.length > 0);
  },
}

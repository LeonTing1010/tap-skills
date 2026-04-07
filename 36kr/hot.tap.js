export default {
  site: "36kr",
  name: "hot",
  intent: "read",
  description: "36kr hot list - tech and startup news",
  health: { min_rows: 5, non_empty: ["title"] },

  async tap(handle, _args) {
    try {
      const data = await handle.fetch(
        "https://gateway.36kr.com/api/mis/nav/home/nav/rank/hot",
      );
      if (data.code === 0 && data.data?.hotRankList) {
        return data.data.hotRankList.map((item, i) => ({
          rank: String(i + 1),
          title: item.templateMaterial?.widgetTitle || item.title || "",
          hot: String(item.hotScore || item.statRead || 0),
        }));
      }
    } catch { /* fall through to fallback */ }

    // Fallback: newsflash API
    const data2 = await handle.fetch("https://36kr.com/api/newsflash?b_id=0&per_page=20");
    return (data2.data?.items || []).map((item, i) => ({
      rank: String(i + 1),
      title: item.title || "",
      hot: "0",
    }));
  },
}

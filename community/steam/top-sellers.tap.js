export default {
  site: "steam",
  name: "top-sellers",
  intent: "read",
  description: "Steam top selling games",
  health: { min_rows: 5, non_empty: ["title"] },

  async tap(handle, _args) {
    const data = await handle.fetch(
      "https://store.steampowered.com/api/featuredcategories?cc=us&l=english",
    );
    return (data.top_sellers.items || []).map((g, i) => ({
      rank: String(i + 1),
      title: String(g.name),
      price: g.final_price ? "$" + (g.final_price / 100).toFixed(2) : "Free",
      discount: g.discount_percent ? g.discount_percent + "% off" : "-",
    }));
  },
}

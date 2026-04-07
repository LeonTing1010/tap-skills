export default {
  site: "steam",
  name: "top-sellers",
  intent: "read",
  description: "Steam top selling games",
  url: "https://store.steampowered.com",

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch('https://store.steampowered.com/api/featuredcategories?cc=us&l=english')
    const data = await res.json()
    return (data.top_sellers.items || []).map((g, i) => ({
      rank: String(i + 1),
      title: String(g.name),
      price: g.final_price ? '$' + (g.final_price / 100).toFixed(2) : 'Free',
      discount: g.discount_percent ? g.discount_percent + '% off' : '-'
    }))
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

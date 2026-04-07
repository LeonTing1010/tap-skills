export default {
  site: "coingecko",
  name: "top",
  intent: "read",
  description: "Top cryptocurrencies by market cap",
  url: "https://www.coingecko.com",
  health: { min_rows: 5, non_empty: ["name", "symbol"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50')
    const data = await res.json()
    return data.map(c => ({
      name: c.name,
      symbol: c.symbol.toUpperCase(),
      price: '$' + (c.current_price || 0).toLocaleString(),
      change_24h: (c.price_change_percentage_24h >= 0 ? '+' : '') + (c.price_change_percentage_24h || 0).toFixed(2) + '%'
    }))
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

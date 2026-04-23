export default {
  site: "google",
  name: "trends",
  intent: "read",
  description: "Google Trends daily trending searches",
  args: { geo: { type: "string", default: "US" } },
  health: { min_rows: 5, non_empty: ["title"] },

  tap: async (tap, args) => {
    // Google Trends daily trends API (unofficial but stable)
    const tz = new Date().getTimezoneOffset()
    const url =
      "https://trends.google.com/trends/api/dailytrends?hl=en-US&tz=" +
      tz + "&geo=" + (args.geo || "US") + "&ns=15"
    const text = await tap.fetch(url, { responseType: "text" })
    // Response starts with ")]}',\n" — strip it
    const json = JSON.parse(String(text).replace(/^\)\]\}',\n/, ""))
    const trendingStories =
      json?.default?.trendingSearchesDays?.[0]?.trendingSearches || []
    return trendingStories.map((item, i) => ({
      rank: String(i + 1),
      title: item.title?.query || "",
      hot: String(item.formattedTraffic || "0"),
      articles: String((item.articles || []).length),
    }))
  },
}

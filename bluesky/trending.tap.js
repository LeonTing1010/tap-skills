export default {
  site: "bluesky",
  name: "trending",
  intent: "read",
  description: "Bluesky Trending Topics",
  url: "https://bsky.app",
  health: { min_rows: 3, non_empty: ["topic"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch("https://public.api.bsky.app/xrpc/app.bsky.unspecced.getTrendingTopics", { credentials: 'include' })
    const data = await res.json()
    const topics = data.topics || []
    return topics.map(item => ({
      topic: item.topic
    }))
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

export default {
  site: "bluesky",
  name: "trending",
  intent: "read",
  description: "Bluesky Trending Topics",
  health: { min_rows: 3, non_empty: ["topic"] },

  async tap(handle, _args) {
    const data = await handle.fetch(
      "https://public.api.bsky.app/xrpc/app.bsky.unspecced.getTrendingTopics",
    );
    return (data.topics || []).map(item => ({
      topic: item.topic,
    }));
  },
}

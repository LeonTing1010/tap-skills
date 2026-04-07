export default {
  site: "reddit",
  name: "hot",
  intent: "read",
  description: "Reddit Hot Posts",
  health: { min_rows: 10, non_empty: ["title"] },

  async tap(handle, _args) {
    const data = await handle.fetch(
      "https://www.reddit.com/r/popular/hot.json?limit=50&raw_json=1",
      { headers: { "User-Agent": "tap-skill/1.0" } },
    );
    return data.data.children.map((child, i) => ({
      rank: String(i + 1),
      title: child.data.title,
      subreddit: child.data.subreddit_name_prefixed || child.data.subreddit,
      score: String(child.data.score || 0),
    }));
  },
}

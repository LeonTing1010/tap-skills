export default {
  site: "reddit",
  name: "search",
  intent: "read",
  description: "Search Reddit posts",
  args: { keyword: { type: "string" } },
  health: { min_rows: 3, non_empty: ["title"] },

  async tap(handle, args) {
    const params = new URLSearchParams({
      q: args.keyword,
      limit: "30",
      raw_json: "1",
      sort: "relevance",
      t: "all",
    });
    const data = await handle.fetch(
      "https://www.reddit.com/search.json?" + params.toString(),
      { headers: { "User-Agent": "tap-skill/1.0" } },
    );
    return (data.data?.children || []).map((child, i) => ({
      rank: String(i + 1),
      title: child.data.title,
      subreddit: child.data.subreddit_name_prefixed || child.data.subreddit,
      score: String(child.data.score || 0),
      comments: String(child.data.num_comments || 0),
      url: "https://reddit.com" + child.data.permalink,
    }));
  },
}

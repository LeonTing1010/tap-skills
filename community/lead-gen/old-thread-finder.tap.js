export default {
  site: "lead-gen",
  name: "old-thread-finder",
  intent: "read",
  description: "发现3-4月旧帖但仍在Google活跃的Reddit帖子",
  columns: ["title", "age_days", "comments", "score", "url"],

  args: {
    keywords: { type: "string", description: "关键词" },
    subreddit: { type: "string", description: "subreddit名称" },
    maxResults: { type: "string", description: "最大结果数" }
  },

  tap: async (tap, args) => {
    const keywords = args.keywords || "";
    const subreddit = args.subreddit || "saas";
    const maxResults = parseInt(args.maxResults) || 20;

    const searchUrl = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(keywords)}&sort=top&t=month&limit=50`;

    const data = await tap.fetch(searchUrl, {
      headers: { "User-Agent": "tap-old-thread/1.0" }
    });

    const posts = data.data.children.map(c => c.data);
    const now = Date.now();
    const thirtyDaysAgo = 30 * 24 * 60 * 60 * 1000;

    const oldPosts = posts.filter(post => {
      const postTime = post.created_utc * 1000;
      const age = now - postTime;
      return age > thirtyDaysAgo && post.num_comments > 5;
    });

    return oldPosts.slice(0, maxResults).map(post => ({
      title: post.title.substring(0, 100),
      age_days: String(Math.floor((now - post.created_utc * 1000) / (24 * 60 * 60 * 1000))),
      comments: String(post.num_comments),
      score: String(post.score),
      url: `https://reddit.com${post.permalink}`
    }));
  }
};

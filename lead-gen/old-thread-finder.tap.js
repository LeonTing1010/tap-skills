tap({
  name: "old-thread-finder",
  desc: "发现3-4月旧帖但仍在Google活跃的Reddit帖子",
  
  params: {
    keywords: "关键词",
    subreddit: "subreddit名称",
    maxResults: "最大结果数"
  },

  run({ keywords, subreddit = "saas", maxResults = 20 }) {
    return findOldActiveThreads(keywords, subreddit, maxResults);
  },

  async findOldActiveThreads(keywords, subreddit, maxResults) {
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
    
    return {
      columns: ["title", "age_days", "comments", "score", "url"],
      rows: oldPosts.slice(0, maxResults).map(post => ({
        title: post.title.substring(0, 100),
        age_days: Math.floor((now - post.created_utc * 1000) / (24 * 60 * 60 * 1000)),
        comments: post.num_comments,
        score: post.score,
        url: `https://reddit.com${post.permalink}`
      }))
    };
  }
});

tap({
  name: "subreddit-monitor",
  desc: "监控subreddit上的高意图帖子并实时提醒",
  
  params: {
    subreddits: "要监控的subreddits列表",
    keywords: "关键词",
    minScore: "最低分数",
    minComments: "最低评论数"
  },

  async run({ 
    subreddits = ["saas", "startups", "entrepreneur"], 
    keywords = [],
    minScore = 5,
    minComments = 3 
  }) {
    const allPosts = [];
    
    for (const subreddit of subreddits) {
      const posts = await fetchSubredditPosts(subreddit, minScore, minComments);
      allPosts.push(...posts);
    }
    
    const highIntentPosts = allPosts
      .map(post => ({
        ...post,
        ...analyzeIntent(post.title + " " + (post.selftext || ""))
      }))
      .filter(p => p.intentScore >= 4)
      .sort((a, b) => b.intentScore - a.intentScore);
    
    return {
      columns: ["source", "title", "score", "comments", "intent", "matched_phrases"],
      rows: highIntentPosts.slice(0, 30)
    };
  },

  async fetchSubredditPosts(subreddit, minScore, minComments) {
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=50`;
    
    const data = await tap.fetch(url, {
      headers: { "User-Agent": "tap-monitor/1.0" }
    });
    
    return data.data.children
      .map(c => c.data)
      .filter(post => post.score >= minScore && post.num_comments >= minComments)
      .map(post => ({
        source: `reddit:r/${subreddit}`,
        title: post.title,
        score: post.score,
        comments: post.num_comments,
        url: `https://reddit.com${post.permalink}`,
        selftext: post.selftext
      }));
  },

  analyzeIntent(text) {
    const patterns = [
      { pattern: /手动做了\d+(天|周|月|年)|doing this manually|I have been doing this/, label: "手动做了", score: 5 },
      { pattern: /便宜.*替代|cheaper alternative|更便宜|找替代/, label: "找替代", score: 4 },
      { pattern: /(竟然|为什么).*没有|can't believe|I can't believe/, label: "竟然没有", score: 4 },
      { pattern: /overkill|太复杂|too complex|too much/, label: "overkill", score: 3 },
      { pattern: /我只需要|我就想要|I just need|just want|I want/, label: "只需要", score: 5 }
    ];
    
    const matched = [];
    let score = 0;
    
    for (const p of patterns) {
      if (p.pattern.test(text)) {
        matched.push(p.label);
        score += p.score;
      }
    }
    
    let intent = "LOW";
    if (score >= 8) intent = "HIGH";
    else if (score >= 4) intent = "MEDIUM";
    
    return { intent, intentScore: score, matched_phrases: matched.join(", ") };
  }
});

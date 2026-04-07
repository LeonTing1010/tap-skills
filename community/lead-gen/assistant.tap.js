function analyzeIntent(text) {
  const patterns = [
    { pattern: /手动做了\d+(天|周|月|年)/, label: "manually for time", score: 5 },
    { pattern: /便宜.*替代/, label: "cheaper alternative", score: 4 },
    { pattern: /(竟然|为什么).*没有.*简单的/, label: "no simple solution", score: 4 },
    { pattern: /overkill|太复杂|对我来说/, label: "overkill", score: 3 },
    { pattern: /我只需要|我就想要/, label: "just need", score: 5 },
    { pattern: /is there a (cheaper|simple)/, label: "is there cheaper", score: 4 }
  ];

  const matched = [];
  let score = 0;

  for (const p of patterns) {
    if (p.pattern.test(text)) {
      matched.push(p.label);
      score += p.score;
    }
  }

  let label = "LOW";
  if (score >= 8) label = "HIGH";
  else if (score >= 4) label = "MEDIUM";

  return { label, score, matched };
}

export default {
  site: "lead-gen",
  name: "assistant",
  intent: "read",
  description: "AI智能获客助手 - 找第一客户",
  columns: ["source", "post", "intent", "reason", "score"],

  args: {
    product: { type: "string", description: "产品描述" },
    subreddits: { type: "string", description: "目标subreddits" },
    keywords: { type: "string", description: "关键词列表" }
  },

  health: {
    min_rows: 5,
    non_empty: ["source", "post", "intent"]
  },

  tap: async (tap, args) => {
    const subreddits = args.subreddits ? args.subreddits.split(",").map(s => s.trim()) : ["saas", "startups", "entrepreneur"];
    const keywords = args.keywords ? args.keywords.split(",").map(k => k.trim()) : [];
    const results = [];

    for (const subreddit of subreddits) {
      const query = keywords.join(" OR ") || "help";
      const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&sort=top&t=month&limit=30`;

      const data = await tap.fetch(url, {
        headers: { "User-Agent": "tap-lead-gen/1.0" }
      });

      const posts = data.data.children.map(c => c.data);

      for (const post of posts) {
        const intent = analyzeIntent(post.title + " " + (post.selftext || ""));
        if (intent.score >= 2) {
          results.push({
            source: `reddit:r/${subreddit}`,
            post: post.title.substring(0, 200),
            intent: intent.label,
            reason: intent.matched.join(", "),
            score: String(intent.score)
          });
        }
      }
    }

    results.sort((a, b) => Number(b.score) - Number(a.score));
    return results.slice(0, 50);
  }
};

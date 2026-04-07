export default {
  site: "reddit",
  name: "hot",
  intent: "read",
  description: "Reddit Hot Posts",
  url: "https://www.reddit.com/",

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch('https://www.reddit.com/r/popular/hot.json?limit=50&raw_json=1')
    const data = await res.json()
    return data.data.children.map((child, i) => ({
      rank: String(i + 1),
      title: child.data.title,
      subreddit: child.data.subreddit_name_prefixed || child.data.subreddit,
      score: String(child.data.score || 0)
    }))
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

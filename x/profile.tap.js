export default {
  site: "x",
  name: "profile",
  intent: "read",
  description: "Get posts from an X/Twitter profile with engagement stats",
  url: (args) => `https://x.com/${(args.username || '').replace('@', '')}`,
  args: [
    { name: "username", type: "string", required: true, description: "X handle (with or without @)" }
  ],
  waitFor: "article",
  timeout: 15000,
  health: { min_rows: 1, non_empty: ["text"] },
  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = (args) => {
    const seen = new Set()
    return Array.from(document.querySelectorAll('article')).map(el => {
      const textEl = el.querySelector('[data-testid="tweetText"]')
      const text = textEl ? textEl.textContent.trim().substring(0, 200) : ""

      const group = el.querySelector('[role="group"]')
      const ariaLabel = group?.getAttribute('aria-label') || ''
      const replyMatch = ariaLabel.match(/(\d+)\s*repl/i)
      const repostMatch = ariaLabel.match(/(\d+)\s*repost/i)
      const likeMatch = ariaLabel.match(/(\d+)\s*like/i)
      const viewMatch = ariaLabel.match(/(\d+)\s*view/i)

      const timeEl = el.querySelector('time')
      const time = timeEl ? timeEl.getAttribute('datetime') || timeEl.textContent || '' : ''
      const linkEl = el.querySelector('a[href*="/status/"]')
      const url = linkEl ? 'https://x.com' + linkEl.getAttribute('href') : ''

      const key = text.slice(0, 50)
      if (seen.has(key)) return null
      seen.add(key)

      return {
        text,
        replies: String(replyMatch ? replyMatch[1] : '0'),
        reposts: String(repostMatch ? repostMatch[1] : '0'),
        likes: String(likeMatch ? likeMatch[1] : '0'),
        views: String(viewMatch ? viewMatch[1] : '0'),
        time,
        url
      }
    }).filter(Boolean)
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}
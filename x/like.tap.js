export default {
  site: "x",
  name: "like",
  description: "Like an X/Twitter post by URL",
  args: [
    { name: "url", type: "string", required: true, description: "Post URL (https://x.com/user/status/123)" }
  ],
  columns: ["status", "url"],
  async run(tap, args) {
    if (!args.url) throw new Error('url is required')
    await tap.nav(args.url)
    await tap.wait(2000)

    // Find the main tweet's like button (first article)
    const result = await tap.eval(() => {
      const article = document.querySelector('article')
      // Check if already liked
      const unlikeBtn = article?.querySelector('[data-testid="unlike"]')
      if (unlikeBtn) return 'already_liked'
      const likeBtn = article?.querySelector('[data-testid="like"]')
      if (likeBtn) { likeBtn.click(); return 'liked' }
      return 'not_found'
    })
    await tap.wait(1000)
    return [{ status: String(result), url: String(args.url) }]
  }
}
export default {
  site: "reddit",
  name: "comment",
  description: "Post a comment on Reddit (requires login)",
  columns: ["status", "url"],
  args: {
    post_url: { type: "string" },
    content: { type: "string" }
  },

  async run(page, args) {
    if (!args.post_url || !args.content) {
      return [{ status: "error", url: "missing post_url or content" }]
    }

    // === Strategy 1: Reddit API (fast, no navigation, no CAPTCHA) ===
    try {
      // Extract thing_id from URL: /comments/{post_id}/...[/{comment_id}/]
      const urlMatch = args.post_url.match(/\/comments\/(\w+)/)
      const commentMatch = args.post_url.match(/\/comment\/(\w+)/)
      // Reply to comment if comment_id present, otherwise reply to post
      const thing_id = commentMatch ? `t1_${commentMatch[1]}` : urlMatch ? `t3_${urlMatch[1]}` : null

      if (thing_id) {
        const meRes = await page.fetch("https://www.reddit.com/api/me.json", {
          credentials: "include"
        })
        const me = JSON.parse(meRes.body)
        const modhash = me?.data?.modhash || ""

        const res = await page.fetch("https://www.reddit.com/api/comment", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            api_type: "json",
            thing_id,
            text: args.content,
            uh: modhash
          }).toString()
        })
        const data = JSON.parse(res.body)
        if (data.json?.data?.things?.[0]?.data?.permalink) {
          const permalink = data.json.data.things[0].data.permalink
          return [{ status: "commented", url: `https://www.reddit.com${permalink}` }]
        }
        if (data.json?.errors?.length) {
          const errMsg = data.json.errors.map(e => e.join(": ")).join("; ")
          return [{ status: "error", url: errMsg }]
        }
      }
    } catch (_) {
      // API failed, fall through to form
    }

    // === Strategy 2: old.reddit.com form fallback ===
    const oldUrl = args.post_url.replace("www.reddit.com", "old.reddit.com")
    await page.nav(oldUrl)

    await page.fill('[name="text"]', args.content)
    await page.click('.save[type="submit"]')
    await page.wait(5000)

    const url = await page.eval(() => location.href)
    return [{ status: "commented", url }]
  }
}

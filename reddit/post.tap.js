export default {
  site: "reddit",
  name: "post",
  description: "Submit a post to Reddit",
  columns: ["status", "url"],
  args: {
    title: { type: "string" },
    subreddit: { type: "string" },
    content: { type: "string", optional: true },
    link: { type: "string", optional: true }
  },

  async run(page, args) {
    if (!args.title || !args.subreddit) {
      return [{ status: "error", url: "missing title or subreddit" }]
    }

    const sub = args.subreddit.replace(/^r\//, "")
    const kind = args.link ? "link" : "self"

    // === Strategy 1: Reddit API with modhash (fast, no navigation) ===
    try {
      const meRes = await page.fetch("https://www.reddit.com/api/me.json", {
        credentials: "include"
      })
      const me = JSON.parse(meRes.body)
      const modhash = me?.data?.modhash || ""

      const res = await page.fetch("https://www.reddit.com/api/submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          api_type: "json",
          kind,
          sr: sub,
          title: args.title,
          uh: modhash,
          ...(args.link ? { url: args.link, resubmit: "true" } : {}),
          ...(args.content ? { text: args.content } : {})
        }).toString()
      })
      const data = JSON.parse(res.body)
      if (data.json?.data?.url) {
        return [{ status: "posted", url: data.json.data.url }]
      }
      const errors = data.json?.errors
      if (errors?.length) {
        const errMsg = errors.map(e => e.join(": ")).join("; ")
        if (!errMsg.includes("flair")) {
          return [{ status: "error", url: errMsg }]
        }
      }
    } catch (_) {
      // API failed, fall through to form
    }

    // === Strategy 2: old.reddit.com form (no shadow DOM) ===
    const qs = args.link ? "" : "?selftext=true"
    await page.nav(`https://old.reddit.com/r/${sub}/submit${qs}`)

    await page.fill('[name="title"]', args.title)

    if (args.link) {
      await page.fill('[name="url"]', args.link)
    } else if (args.content) {
      await page.eval(() => {
        const tab = document.querySelector('.text-button')
        if (tab) tab.click()
      })
      await page.wait(500)
      await page.fill('[name="text"]', args.content)
    }

    await page.click('[name="submit"]')
    await page.wait(5000)

    const url = await page.eval(() => location.href)
    const posted = url.includes("/comments/")

    return [{
      status: posted ? "posted" : "check-browser",
      url
    }]
  }
}

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

    // Try API first (requires user to be logged in with cookie auth)
    try {
      const res = await page.fetch("https://oauth.reddit.com/api/submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          api_type: "json",
          kind,
          sr: sub,
          title: args.title,
          ...(args.link ? { url: args.link } : {}),
          ...(args.content ? { text: args.content } : {})
        }).toString()
      })
      const data = JSON.parse(res.body)
      if (data.json?.data?.url) {
        return [{ status: "posted", url: data.json.data.url }]
      }
    } catch (_) {
      // API failed, fall back to form
    }

    // Fallback: use the submit page
    const submitUrl = `https://www.reddit.com/r/${sub}/submit`
    await page.nav(submitUrl)
    await page.wait(3000)

    // Type title
    await page.click('textarea[name="title"], [slot="title"] textarea, input[name="title"]')
    await page.wait(500)
    await page.type('textarea[name="title"], [slot="title"] textarea, input[name="title"]', args.title)
    await page.wait(500)

    if (args.link) {
      // Switch to link tab if needed
      await page.eval(() => {
        const tabs = Array.from(document.querySelectorAll('[role="tab"], button'))
        const linkTab = tabs.find(t => t.textContent?.toLowerCase().includes("link"))
        if (linkTab) linkTab.click()
      })
      await page.wait(1000)
      await page.click('input[name="url"], textarea[name="url"], [slot="url"] input')
      await page.wait(300)
      await page.type('input[name="url"], textarea[name="url"], [slot="url"] input', args.link)
    } else if (args.content) {
      // Type body text
      await page.click('textarea[name="text"], [contenteditable="true"], .DraftEditor-root')
      await page.wait(300)
      await page.type('textarea[name="text"], [contenteditable="true"], .DraftEditor-root', args.content)
    }
    await page.wait(500)

    // Click submit button
    await page.eval(() => {
      const btns = Array.from(document.querySelectorAll('button[type="submit"], button'))
      const post = btns.find(b => /^(post|submit)$/i.test(b.textContent?.trim()))
      if (post) post.click()
    })
    await page.wait(3000)

    const url = await page.eval(() => location.href)
    const posted = !url.includes("/submit")

    return [{
      status: posted ? "posted" : "check-browser",
      url
    }]
  }
}

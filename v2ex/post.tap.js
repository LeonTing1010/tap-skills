export default {
  site: "v2ex",
  name: "post",
  description: "Post a topic on V2EX",
  columns: ["status", "url"],
  args: {
    title: { type: "string" },
    content: { type: "string" },
    node: { type: "string" }
  },

  async run(page, args) {
    if (!args.title || !args.content || !args.node) {
      return [{ status: "error", url: "missing title, content, or node" }]
    }

    // Try API first
    try {
      const token = await page.eval(() => {
        const cookies = document.cookie.split(";").map(c => c.trim())
        // V2EX uses a once token for CSRF, try to get it
        return null
      })
    } catch (_) {}

    // V2EX new topic form
    await page.nav(`https://www.v2ex.com/new/${args.node}`)
    await page.wait(2000)

    // Check if logged in (V2EX redirects to login if not)
    const onPage = await page.eval(() => location.pathname)
    if (onPage.includes("/signin")) {
      return [{ status: "error", url: "not logged in - please sign in to V2EX first" }]
    }

    // Fill in title
    await page.click('input[name="title"], #topic_title')
    await page.wait(300)
    await page.type('input[name="title"], #topic_title', args.title)
    await page.wait(500)

    // Fill in content
    await page.click('textarea[name="content"], #topic_content, textarea.topic_content')
    await page.wait(300)
    await page.type('textarea[name="content"], #topic_content, textarea.topic_content', args.content)
    await page.wait(500)

    // Submit
    await page.click('input[type="submit"], button[type="submit"]')
    await page.wait(3000)

    const url = await page.eval(() => location.href)
    const posted = url.includes("/t/")

    return [{
      status: posted ? "posted" : "check-browser",
      url
    }]
  }
}

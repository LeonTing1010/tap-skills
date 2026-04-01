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

  async run(tap, args) {
    if (!args.title || !args.content || !args.node) {
      return [{ status: "error", url: "missing title, content, or node" }]
    }

    // Try API first
    try {
      const token = await tap.eval(() => {
        const cookies = document.cookie.split(";").map(c => c.trim())
        // V2EX uses a once token for CSRF, try to get it
        return null
      })
    } catch (_) {}

    // V2EX new topic form
    await tap.nav(`https://www.v2ex.com/new/${args.node}`)
    await tap.wait(2000)

    // Check if logged in (V2EX redirects to login if not)
    const onPage = await tap.eval(() => location.pathname)
    if (onPage.includes("/signin")) {
      return [{ status: "error", url: "not logged in - please sign in to V2EX first" }]
    }

    // Fill in title
    await tap.click('input[name="title"], #topic_title')
    await tap.wait(300)
    await tap.type('input[name="title"], #topic_title', args.title)
    await tap.wait(500)

    // Fill in content
    await tap.click('textarea[name="content"], #topic_content, textarea.topic_content')
    await tap.wait(300)
    await tap.type('textarea[name="content"], #topic_content, textarea.topic_content', args.content)
    await tap.wait(500)

    // Submit
    await tap.click('input[type="submit"], button[type="submit"]')
    await tap.wait(3000)

    const url = await tap.eval(() => location.href)
    const posted = url.includes("/t/")

    return [{
      status: posted ? "posted" : "check-browser",
      url
    }]
  }
}

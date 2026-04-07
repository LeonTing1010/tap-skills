export default {
  site: "hackernews",
  name: "submit",
  intent: "write",
  description: "Submit a story to Hacker News",
  columns: ["status", "url"],
  args: {
    title: { type: "string" },
    link: { type: "string", description: "URL to submit (optional if text provided)" },
    text: { type: "string", description: "Text body for Ask HN / Show HN (optional if link provided)" }
  },

  async tap(tap, args) {
    if (!args.title) {
      return [{ status: "error", url: "missing title" }]
    }
    if (!args.link && !args.text) {
      return [{ status: "error", url: "need either link or text" }]
    }

    await tap.nav("https://news.ycombinator.com/submit")
    await tap.wait(2000)

    // Fill title
    await tap.click('input[name="title"]')
    await tap.wait(300)
    await tap.type('input[name="title"]', args.title)
    await tap.wait(300)

    // Fill URL if provided
    if (args.link) {
      await tap.click('input[name="url"]')
      await tap.wait(300)
      await tap.type('input[name="url"]', args.link)
      await tap.wait(300)
    }

    // Fill text if provided
    if (args.text) {
      await tap.click('textarea[name="text"]')
      await tap.wait(300)
      await tap.type('textarea[name="text"]', args.text)
      await tap.wait(300)
    }

    // Submit
    await tap.click('input[type="submit"]')
    await tap.wait(3000)

    const url = await tap.eval(() => location.href)
    const submitted = !url.includes('/submit')

    return [{
      status: submitted ? "submitted" : "check-browser",
      url
    }]
  }
}
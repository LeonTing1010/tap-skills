export default {
  site: "hackernews",
  name: "submit",
  description: "Submit a story to Hacker News",
  columns: ["status", "url"],
  args: {
    title: { type: "string" },
    link: { type: "string", description: "URL to submit (optional if text provided)" },
    text: { type: "string", description: "Text body for Ask HN / Show HN (optional if link provided)" }
  },

  async run(page, args) {
    if (!args.title) {
      return [{ status: "error", url: "missing title" }]
    }
    if (!args.link && !args.text) {
      return [{ status: "error", url: "need either link or text" }]
    }

    await page.nav("https://news.ycombinator.com/submit")
    await page.wait(2000)

    // Fill title
    await page.click('input[name="title"]')
    await page.wait(300)
    await page.type('input[name="title"]', args.title)
    await page.wait(300)

    // Fill URL if provided
    if (args.link) {
      await page.click('input[name="url"]')
      await page.wait(300)
      await page.type('input[name="url"]', args.link)
      await page.wait(300)
    }

    // Fill text if provided
    if (args.text) {
      await page.click('textarea[name="text"]')
      await page.wait(300)
      await page.type('textarea[name="text"]', args.text)
      await page.wait(300)
    }

    // Submit
    await page.click('input[type="submit"]')
    await page.wait(3000)

    const url = await page.eval(() => location.href)
    const submitted = !url.includes('/submit')

    return [{
      status: submitted ? "submitted" : "check-browser",
      url
    }]
  }
}
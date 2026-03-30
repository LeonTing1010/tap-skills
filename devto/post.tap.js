export default {
  site: "devto",
  name: "post",
  description: "Publish an article on Dev.to",
  columns: ["status", "url"],
  args: {
    title: { type: "string", description: "Article title" },
    body: { type: "string", description: "Article body in Markdown" },
    tags: { type: "string", description: "Comma-separated tags (up to 4)" },
    published: { type: "boolean", description: "Publish immediately (default: true)" }
  },

  async run(page, args) {
    if (!args.title || !args.body) throw new Error('title and body are required')

    await page.nav('https://dev.to/new')
    await page.wait(2000)

    // Fill title
    await page.type('#article-form-title', args.title)
    await page.wait(300)

    // Fill body (markdown textarea)
    await page.type('#article_body_markdown', args.body)
    await page.wait(300)

    // Add tags if provided
    if (args.tags) {
      const tags = args.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 4)
      for (const tag of tags) {
        await page.type('#tag-input', tag)
        await page.wait(300)
        await page.pressKey('Enter')
        await page.wait(300)
      }
    }

    // Click Publish
    const published = args.published !== false
    if (published) {
      await page.click('Publish')
      await page.wait(5000)
    } else {
      await page.click('Save draft')
      await page.wait(3000)
    }

    const url = await page.eval(() => location.href)
    const isNew = url.includes('/new')

    return [{
      status: isNew ? 'check-browser' : (published ? 'published' : 'draft-saved'),
      url: String(url)
    }]
  }
}

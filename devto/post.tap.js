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

  async run(tap, args) {
    if (!args.title || !args.body) throw new Error('title and body are required')

    await tap.nav('https://dev.to/new')
    await tap.wait(2000)

    // Fill title
    await tap.type('#article-form-title', args.title)
    await tap.wait(300)

    // Fill body (markdown textarea)
    await tap.type('#article_body_markdown', args.body)
    await tap.wait(300)

    // Add tags if provided
    if (args.tags) {
      const tags = args.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 4)
      for (const tag of tags) {
        await tap.type('#tag-input', tag)
        await tap.wait(300)
        await tap.pressKey('Enter')
        await tap.wait(300)
      }
    }

    // Click Publish
    const published = args.published !== false
    if (published) {
      await tap.click('Publish')
      await tap.wait(5000)
    } else {
      await tap.click('Save draft')
      await tap.wait(3000)
    }

    const url = await tap.eval(() => location.href)
    const isNew = url.includes('/new')

    return [{
      status: isNew ? 'check-browser' : (published ? 'published' : 'draft-saved'),
      url: String(url)
    }]
  }
}

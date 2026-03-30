export default {
  site: "devto",
  name: "publish",
  description: "Publish an article on Dev.to",
  columns: ["status", "url"],
  args: {
    title: { type: "string", description: "Article title" },
    content: { type: "string", description: "Article body in Markdown" },
    tags: { type: "string", description: "Comma-separated tags (e.g. 'ai, opensource')" }
  },

  async run(page, args) {
    if (!args.title || !args.content) throw new Error('title and content are required')

    await page.nav('https://dev.to/new')
    await page.wait(2000)

    // Fill title
    await page.type('#article-form-title', args.title)

    // Fill tags
    if (args.tags) {
      await page.type('#tag-input', args.tags)
    }

    // Fill body via textarea value setter (CodeMirror-like editor)
    await page.eval((content) => {
      const ta = document.querySelector('#article_body_markdown');
      if (!ta) return;
      ta.focus();
      ta.value = content;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }, args.content)
    await page.wait(1000)

    // Click Publish
    await page.click('button.c-btn.c-btn--primary')
    await page.wait(3000)

    const url = await page.eval(() => location.href)
    const published = !url.includes('/new')

    return [{ status: published ? 'published' : 'check-browser', url: String(url) }]
  }
}

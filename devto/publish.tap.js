export default {
  site: "devto",
  name: "publish",
  description: "Publish an article on Dev.to",
  columns: ["status", "url"],
  args: {
    title: { type: "string" },
    content: { type: "string", description: "Markdown content" },
    tags: { type: "string", description: "Comma-separated tags, up to 4 (optional)" }
  },

  async run(page, args) {
    if (!args.title || !args.content) {
      return [{ status: "error", url: "missing title or content" }]
    }

    await page.nav("https://dev.to/new")
    await page.wait(3000)

    // Type title
    await page.click('#article-form-title')
    await page.wait(300)
    await page.type('#article-form-title', args.title)
    await page.wait(500)

    // Add tags if provided
    if (args.tags) {
      await page.click('#tag-input')
      await page.wait(300)
      await page.type('#tag-input', args.tags)
      await page.wait(500)
    }

    // Set body content via native setter (type() times out on long text)
    await page.click('#article_body_markdown')
    await page.wait(300)
    const bodySet = await page.eval(`(() => {
      const ta = document.getElementById('article_body_markdown');
      if (!ta) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(ta, ${JSON.stringify(args.content)});
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`)

    if (!bodySet) {
      return [{ status: "error", url: "could not set body content" }]
    }
    await page.wait(1000)

    // Click Publish
    const published = await page.eval(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent?.trim() === 'Publish' && b.className.includes('c-btn--primary')
      );
      if (btn) { btn.click(); return true; }
      return false;
    })()`)

    await page.wait(5000)
    const url = await page.eval(() => location.href)

    return [{
      status: !url.includes('/new') ? "published" : "check-browser",
      url
    }]
  }
}

export default {
  site: "devto",
  name: "publish",
  intent: "write",
  description: "Publish an article on Dev.to",
  columns: ["status", "url"],
  args: {
    title: { type: "string" },
    content: { type: "string", description: "Markdown content" },
    tags: { type: "string", description: "Comma-separated tags, up to 4 (optional)" }
  },

  async tap(tap, args) {
    if (!args.title || !args.content) {
      return [{ status: "error", url: "missing title or content" }]
    }

    await tap.nav("https://dev.to/new")
    await tap.wait(3000)

    // Type title
    await tap.click('#article-form-title')
    await tap.wait(300)
    await tap.type('#article-form-title', args.title)
    await tap.wait(500)

    // Add tags if provided
    if (args.tags) {
      await tap.click('#tag-input')
      await tap.wait(300)
      await tap.type('#tag-input', args.tags)
      await tap.wait(500)
    }

    // Set body content via native setter (type() times out on long text)
    await tap.click('#article_body_markdown')
    await tap.wait(300)
    const bodySet = await tap.eval(`(() => {
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
    await tap.wait(1000)

    // Click Publish
    const published = await tap.eval(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent?.trim() === 'Publish' && b.className.includes('c-btn--primary')
      );
      if (btn) { btn.click(); return true; }
      return false;
    })()`)

    await tap.wait(5000)
    const url = await tap.eval(() => location.href)

    return [{
      status: !url.includes('/new') ? "published" : "check-browser",
      url
    }]
  }
}

export default {
  site: "juejin",
  name: "publish",
  description: "发布掘金文章",
  columns: ["status", "url"],
  args: {
    title: { type: "string", description: "文章标题" },
    content: { type: "string", description: "文章正文 (Markdown)" },
    category: { type: "string", description: "分类：后端/前端/Android/iOS/人工智能/开发工具/代码人生/阅读" }
  },

  async run(page, args) {
    if (!args.title || !args.content) throw new Error('title and content are required')

    await page.nav('https://juejin.cn/editor/drafts/new?v=2')
    await page.wait(2000)

    // Fill title via native setter
    await page.eval((title) => {
      const el = document.querySelector('.title-input');
      if (!el) return;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(el, title);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, args.title)

    // Fill body via CodeMirror 5 instance
    await page.eval((content) => {
      const cmEl = document.querySelector('.CodeMirror');
      if (cmEl?.CodeMirror) cmEl.CodeMirror.setValue(content);
    }, args.content)
    await page.wait(1000)

    // Click publish button to open panel
    await page.click('button.xitu-btn')
    await page.wait(1000)

    // Select category
    const category = args.category || '人工智能'
    await page.eval((cat) => {
      const items = document.querySelectorAll('.publish-popup .category-list .item');
      for (const item of items) {
        if (item.textContent.trim() === cat) { item.click(); break; }
      }
    }, category)
    await page.wait(500)

    // Click final publish
    await page.eval(() => {
      const btns = document.querySelectorAll('.publish-popup button');
      for (const b of btns) {
        if (b.textContent.trim() === '确定并发布') { b.click(); break; }
      }
    })
    await page.wait(3000)

    const url = await page.eval(() => location.href)
    const published = url.includes('/published') || url.includes('/post/')

    return [{ status: published ? 'published' : 'check-browser', url: String(url) }]
  }
}

export default {
  site: "juejin",
  name: "post",
  description: "在掘金发布文章",
  columns: ["status", "url"],
  args: {
    title: { type: "string", description: "文章标题" },
    body: { type: "string", description: "文章正文 (Markdown)" },
    category: { type: "string", description: "分类: 前端/后端/Android/iOS/AI/工具" },
    tags: { type: "string", description: "逗号分隔标签 (最多3个)" }
  },

  async run(page, args) {
    if (!args.title || !args.body) throw new Error('title and body are required')

    await page.nav('https://juejin.cn/editor/drafts/new?v=2')
    await page.wait(2000)

    // Fill title
    await page.type('.title-input input, input[placeholder*="标题"]', args.title)
    await page.wait(300)

    // Fill body — bytemd markdown editor (CodeMirror)
    await page.click('.bytemd-editor .CodeMirror, .CodeMirror-code, .bytemd-body')
    await page.wait(300)
    await page.type('.bytemd-editor .CodeMirror textarea, .CodeMirror textarea', args.body)
    await page.wait(500)

    // Click publish button to open publish dialog
    await page.click('发布')
    await page.wait(1000)

    // Select category if provided
    if (args.category) {
      await page.click(args.category)
      await page.wait(300)
    }

    // Add tags if provided
    if (args.tags) {
      const tags = args.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 3)
      for (const tag of tags) {
        const tagInput = '[placeholder*="标签"], [placeholder*="搜索添加标签"]'
        await page.type(tagInput, tag)
        await page.wait(500)
        await page.pressKey('Enter')
        await page.wait(300)
      }
    }

    // Confirm publish
    await page.click('确定并发布')
    await page.wait(5000)

    const url = await page.eval(() => location.href)
    const published = url.includes('/post/') && !url.includes('/editor/')

    return [{
      status: published ? 'published' : 'check-browser',
      url: String(url)
    }]
  }
}

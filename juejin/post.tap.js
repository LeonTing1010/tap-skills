export default {
  site: "juejin",
  name: "post",
  description: "Publish article on Juejin",
  columns: ["status", "url"],
  args: {
    title: { type: "string", description: "Article title" },
    body: { type: "string", description: "Article body (Markdown)" },
    category: { type: "string", description: "Category: Frontend/Backend/Android/iOS/AI/Tools" },
    tags: { type: "string", description: "Comma-separated tags (max 3)" }
  },

  async run(tap, args) {
    if (!args.title || !args.body) throw new Error('title and body are required')

    await tap.nav('https://juejin.cn/editor/drafts/new?v=2')
    await tap.wait(2000)

    // Fill title
    await tap.type('.title-input input, input[placeholder*="标题"]', args.title)
    await tap.wait(300)

    // Fill body — bytemd markdown editor (CodeMirror)
    await tap.click('.bytemd-editor .CodeMirror, .CodeMirror-code, .bytemd-body')
    await tap.wait(300)
    await tap.type('.bytemd-editor .CodeMirror textarea, .CodeMirror textarea', args.body)
    await tap.wait(500)

    // Click publish button to open publish dialog
    await tap.click('发布')
    await tap.wait(1000)

    // Select category if provided
    if (args.category) {
      await tap.click(args.category)
      await tap.wait(300)
    }

    // Add tags if provided
    if (args.tags) {
      const tags = args.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 3)
      for (const tag of tags) {
        const tagInput = '[placeholder*="标签"], [placeholder*="搜索添加标签"]'
        await tap.type(tagInput, tag)
        await tap.wait(500)
        await tap.pressKey('Enter')
        await tap.wait(300)
      }
    }

    // Confirm publish
    await tap.click('确定并发布')
    await tap.wait(5000)

    const url = await tap.eval(() => location.href)
    const published = url.includes('/post/') && !url.includes('/editor/')

    return [{
      status: published ? 'published' : 'check-browser',
      url: String(url)
    }]
  }
}

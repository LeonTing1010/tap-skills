export default {
  site: "xiaohongshu",
  name: "publish_text",
  description: "发布纯文字小红书笔记（无需图片）",
  columns: ["status", "url"],
  args: {
    title: { type: "string" },
    content: { type: "string" }
  },

  async run(tap, args) {
    await tap.type("input.d-text", args.title)
    await tap.wait(500)

    await tap.type(".tiptap.ProseMirror", args.content)
    await tap.wait(500)

    await tap.click("发布")
    await tap.wait(5000)

    const url = await tap.eval(() => location.href)
    return [{
      status: url.includes('/publish/publish') ? 'check-browser' : 'published',
      url
    }]
  }
}

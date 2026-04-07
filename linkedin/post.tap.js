export default {
  site: "linkedin",
  name: "post",
  intent: "write",
  description: "Post to LinkedIn feed",
  columns: ["status", "url"],
  args: {
    content: { type: "string" }
  },

  async tap(tap, args) {
    if (!args.content) {
      return [{ status: "error", url: "missing content arg" }]
    }

    await tap.nav("https://www.linkedin.com/feed/")
    await tap.wait(2000)

    // Click "Start a post" button
    await tap.click("Start a post")
    await tap.wait(2000)

    // Type into the post editor
    await tap.type('[role="textbox"], .ql-editor, [contenteditable="true"]', args.content)
    await tap.wait(1000)

    // Click Post button
    await tap.click("Post")
    await tap.wait(3000)

    const url = await tap.eval(() => location.href)
    return [{ status: "posted", url }]
  }
}

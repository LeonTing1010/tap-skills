export default {
  site: "notion",
  name: "create",
  intent: "write",
  description: "Create a new page in Notion",
  columns: ["status", "url"],
  args: {
    title: { type: "string" },
    content: { type: "string", default: "" }
  },

  async tap(tap, args) {
    if (!args.title) {
      return [{ status: "error", url: "missing title arg" }]
    }

    await tap.nav("https://www.notion.so")
    await tap.wait(2000)

    // Create new page via keyboard shortcut
    await tap.pressKey("n", 8) // Cmd+N (meta=8)
    await tap.wait(2000)

    // Type title
    await tap.type('[placeholder="Untitled"], .notion-title-input, [contenteditable]', args.title)
    await tap.pressKey("Enter")
    await tap.wait(500)

    // Type content if provided
    if (args.content) {
      await tap.type('[data-content-editable-leaf], [placeholder="Type"], [contenteditable]', args.content)
      await tap.wait(500)
    }

    await tap.wait(1000)
    const url = await tap.eval(() => location.href)

    return [{ status: "created", url }]
  }
}

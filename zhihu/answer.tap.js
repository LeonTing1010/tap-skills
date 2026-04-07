export default {
  site: "zhihu",
  name: "answer",
  intent: "write",
  description: "Write answer on current Zhihu question page",
  columns: ["status", "url"],
  args: {
    content: { type: "string" }
  },

  async tap(tap, args) {
    if (!args.content) {
      return [{ status: "error", url: "missing content arg" }]
    }

    // Click "写回答" button
    await tap.click("写回答")
    await tap.wait(1500)

    // Type into the rich text editor
    await tap.click(".AnswerForm .RichText")
    await tap.wait(500)
    await tap.type(".AnswerForm .RichText", args.content)
    await tap.wait(500)

    // Submit
    await tap.click("提交回答")
    await tap.wait(3000)

    const url = await tap.eval(() => location.href)
    return [{ status: "submitted", url }]
  }
}

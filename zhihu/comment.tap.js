export default {
  site: "zhihu",
  name: "comment",
  description: "对当前已打开的知乎回答发表评论",
  columns: ["status", "comment"],
  args: {
    comment: { type: "string" }
  },

  async run(tap, args) {
    if (!args.comment) {
      return [{ status: "error", comment: "missing comment arg" }]
    }

    // Click the comment button to open comment panel
    await tap.click("button.CommentButton")
    await tap.wait(1000)

    // Click the comment input area (contenteditable)
    await tap.click("[contenteditable]")
    await tap.wait(500)

    // Type comment
    await tap.type("[contenteditable]", args.comment)
    await tap.wait(500)

    // Submit comment
    await tap.click("button.CommentEditorV2-singleButton")
    await tap.wait(2000)

    return [{ status: "sent", comment: args.comment }]
  }
}

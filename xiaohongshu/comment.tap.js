export default {
  site: "xiaohongshu",
  name: "comment",
  description: "对当前已打开的笔记发表评论",
  columns: ["status", "comment"],
  args: {
    comment: { type: "string" }
  },

  async run(tap, args) {
    if (!args.comment) {
      return [{ status: "error", comment: "missing comment arg" }]
    }

    // Click comment input to activate
    await tap.click("#content-textarea")
    await tap.wait(500)

    // Type comment
    await tap.type("#content-textarea", args.comment)
    await tap.wait(500)

    // Submit — use selector to avoid matching wrong "发送" text
    await tap.click("button.submit")
    await tap.wait(2000)

    return [{ status: "sent", comment: args.comment }]
  }
}

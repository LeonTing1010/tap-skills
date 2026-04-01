export default {
  site: "weibo",
  name: "comment",
  description: "对当前已打开的微博帖子发表评论",
  columns: ["status", "comment"],
  args: {
    comment: { type: "string" }
  },

  async run(tap, args) {
    if (!args.comment) {
      return [{ status: "error", comment: "missing comment arg" }]
    }

    // Click comment input area to activate
    await tap.click("textarea")
    await tap.wait(500)

    // Type comment
    await tap.type("textarea", args.comment)
    await tap.wait(500)

    // Submit comment
    await tap.click("button.m-send-btn")
    await tap.wait(2000)

    return [{ status: "sent", comment: args.comment }]
  }
}

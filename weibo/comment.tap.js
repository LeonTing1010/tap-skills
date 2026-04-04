export default {
  site: "weibo",
  name: "comment",
  description: "Post a comment on current Weibo post",
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

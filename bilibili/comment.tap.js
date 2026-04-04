export default {
  site: "bilibili",
  name: "comment",
  description: "Post a comment on current Bilibili video",
  columns: ["status", "comment"],
  args: {
    comment: { type: "string" }
  },

  async run(tap, args) {
    if (!args.comment) {
      return [{ status: "error", comment: "missing comment arg" }]
    }

    // Click comment textarea to focus
    await tap.click(".reply-box-textarea, textarea")
    await tap.wait(500)

    // Type comment
    await tap.type(".reply-box-textarea, textarea", args.comment)
    await tap.wait(500)

    // Click submit button
    await tap.click(".reply-box-send")
    await tap.wait(2000)

    return [{ status: "sent", comment: args.comment }]
  }
}

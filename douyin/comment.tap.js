export default {
  site: "douyin",
  name: "comment",
  description: "对当前已打开的抖音视频发表评论",
  columns: ["status", "comment"],
  args: {
    comment: { type: "string" }
  },

  async run(tap, args) {
    if (!args.comment) {
      return [{ status: "error", comment: "missing comment arg" }]
    }

    // Click comment input to activate
    await tap.click('div[data-e2e="comment-input"]')
    await tap.wait(500)

    // Type comment
    await tap.type('div[data-e2e="comment-input"]', args.comment)
    await tap.wait(500)

    // Submit
    await tap.click('div[data-e2e="comment-post"]')
    await tap.wait(2000)

    return [{ status: "sent", comment: args.comment }]
  }
}

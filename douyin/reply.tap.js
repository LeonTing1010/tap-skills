export default {
  site: "douyin",
  name: "reply",
  intent: "write",
  description: "Reply to a specific comment on Douyin video",
  columns: ["status", "comment"],
  args: {
    index: { type: "int", default: 1 },
    comment: { type: "string" }
  },

  async tap(tap, args) {
    if (!args.comment) {
      return [{ status: "error", comment: "missing comment arg" }]
    }

    // Click reply on the Nth comment
    const found = await tap.eval((a) => {
      const items = document.querySelectorAll('[class*="commentItem"], [class*="comment-item"]')
      const idx = (a.index || 1) - 1
      const item = items[idx]
      if (!item) return false
      const replyBtn = item.querySelector('[class*="reply"], [class*="Reply"]')
      if (replyBtn) replyBtn.click()
      return !!replyBtn
    }, args)

    if (!found) {
      return [{ status: "error", comment: "comment not found at index " + args.index }]
    }

    await tap.wait(1000)
    await tap.type("textarea", args.comment)
    await tap.wait(500)
    await tap.click("发布")
    await tap.wait(2000)

    return [{ status: "replied", comment: args.comment }]
  }
}

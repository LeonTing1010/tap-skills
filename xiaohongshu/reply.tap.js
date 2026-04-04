export default {
  site: "xiaohongshu",
  name: "reply",
  description: "Reply to comments on my Xiaohongshu notes",
  columns: ["status"],
  args: {
    note_id: { type: "string" },
    comment_index: { type: "int", default: 1 },
    text: { type: "string" }
  },

  async run(tap, args) {
    if (!args.text) {
      return [{ status: "error: missing text arg" }]
    }

    // Find the Nth top-level comment and click its reply button
    const commentSel = `.comment-item:nth-child(${args.comment_index})`
    await tap.waitFor(commentSel, 10000)

    // Click "回复" on the target comment to focus the reply input
    await tap.click(`${commentSel} .reply-btn`)
    await tap.wait(500)

    // Type the reply text into the active input
    await tap.type("#content-textarea", args.text)
    await tap.wait(500)

    // Submit the reply
    await tap.click("button.submit")
    await tap.wait(2000)

    return [{ status: "sent" }]
  }
}

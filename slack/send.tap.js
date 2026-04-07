export default {
  site: "slack",
  name: "send",
  intent: "write",
  description: "Send a message in the current Slack channel",
  columns: ["status", "message"],
  args: {
    message: { type: "string" }
  },

  async tap(tap, args) {
    if (!args.message) {
      return [{ status: "error", message: "missing message arg" }]
    }

    // Type into the message composer
    await tap.click('[data-qa="message_input"], .ql-editor, [contenteditable="true"]')
    await tap.wait(300)
    await tap.type('[data-qa="message_input"], .ql-editor, [contenteditable="true"]', args.message)
    await tap.wait(300)

    // Send with Enter
    await tap.pressKey("Enter")
    await tap.wait(1000)

    return [{ status: "sent", message: args.message }]
  }
}

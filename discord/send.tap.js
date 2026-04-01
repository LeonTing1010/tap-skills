export default {
  site: "discord",
  name: "send",
  description: "Send a message in the current Discord channel",
  columns: ["status", "message"],
  args: {
    message: { type: "string" }
  },

  async run(tap, args) {
    if (!args.message) {
      return [{ status: "error", message: "missing message arg" }]
    }

    // Type into the message input
    await tap.click('[role="textbox"]')
    await tap.wait(300)
    await tap.type('[role="textbox"]', args.message)
    await tap.wait(300)

    // Send with Enter
    await tap.pressKey("Enter")
    await tap.wait(1000)

    return [{ status: "sent", message: args.message }]
  }
}

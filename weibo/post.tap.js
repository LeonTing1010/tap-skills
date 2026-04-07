export default {
  site: "weibo",
  name: "post",
  intent: "write",
  description: "Publish a Weibo post",
  columns: ["status", "url"],
  args: {
    content: { type: "string" }
  },

  async tap(tap, args) {
    if (!args.content) {
      return [{ status: "error", url: "missing content arg" }]
    }

    await tap.nav("https://weibo.com")
    await tap.wait(2000)

    // Click compose area
    await tap.click("textarea[placeholder]")
    await tap.wait(500)

    // Type content
    await tap.type("textarea", args.content)
    await tap.wait(500)

    // Click publish button
    await tap.click('[node-type="submit"]')
    await tap.wait(3000)

    const url = await tap.eval(() => location.href)
    return [{ status: "posted", url }]
  }
}

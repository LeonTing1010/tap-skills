export default {
  site: "medium",
  name: "publish",
  intent: "write",
  description: "Publish an article on Medium",
  columns: ["status", "url"],
  args: {
    title: { type: "string" },
    content: { type: "string" }
  },

  async tap(tap, args) {
    if (!args.title || !args.content) {
      return [{ status: "error", url: "missing title or content" }]
    }

    await tap.nav("https://medium.com/new-story")
    await tap.wait(3000)

    // Type title
    await tap.click('[data-testid="title"], h3[data-contents], [role="textbox"]')
    await tap.wait(500)
    await tap.type('[data-testid="title"], h3[data-contents], [role="textbox"]', args.title)
    await tap.pressKey("Enter")
    await tap.wait(500)

    // Type body content
    await tap.type('[data-testid="body"], p[data-contents], .section-content', args.content)
    await tap.wait(1000)

    // Click publish flow
    await tap.click("Publish")
    await tap.wait(2000)

    // Confirm publish in modal
    const confirmBtn = await tap.eval(() => {
      const btns = Array.from(document.querySelectorAll("button"))
      const pub = btns.find(b => b.textContent?.includes("Publish"))
      if (pub) { pub.click(); return true }
      return false
    })

    await tap.wait(3000)
    const url = await tap.eval(() => location.href)

    return [{
      status: confirmBtn ? "published" : "check-browser",
      url
    }]
  }
}

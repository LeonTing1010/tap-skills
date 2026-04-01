export default {
  site: "x",
  name: "post",
  description: "Post a tweet on X/Twitter",
  columns: ["status", "url"],
  args: {
    content: { type: "string", description: "Tweet text (max 280 chars)" }
  },

  async run(tap, args) {
    if (!args.content) throw new Error('content is required')

    // Use Home inline editor (compose dialog is fragile — DOM.focus dismisses it)
    await tap.nav('https://x.com/home')
    await tap.wait(2000)

    // Click the inline compose box
    await tap.click('[data-testid="tweetTextarea_0"]')
    await tap.wait(500)

    // Insert text via execCommand — works with X's Draft.js editor
    await tap.eval((text) => {
      const el = document.querySelector('[data-testid="tweetTextarea_0"]');
      if (el) { el.focus(); document.execCommand('insertText', false, text); }
    }, args.content)
    await tap.wait(1000)

    // Click the inline Post button
    await tap.click('[data-testid="tweetButtonInline"]')
    await tap.wait(3000)

    const status = await tap.eval(() =>
      document.body.innerText.includes('Your post was sent') ? 'posted' : 'check-browser'
    )
    const url = await tap.eval(() => location.href)

    return [{ status: String(status), url: String(url) }]
  }
}

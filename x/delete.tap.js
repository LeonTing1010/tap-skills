export default {
  site: "x",
  name: "delete",
  intent: "write",
  description: "Delete an X/Twitter post by URL",
  args: [
    { name: "url", type: "string", required: true, description: "Post URL (https://x.com/user/status/123)" }
  ],
  columns: ["status", "url"],
  async tap(tap, args) {
    if (!args.url) throw new Error('url is required')

    await tap.nav(args.url)
    await tap.wait(2000)

    // Click the "..." menu on the post
    await tap.click('[data-testid="caret"]')
    await tap.wait(1000)

    // Click Delete menu item
    await tap.eval(() => {
      const items = document.querySelectorAll('[role="menuitem"]')
      const del = Array.from(items).find(m => m.textContent.includes('Delete'))
      if (del) del.click()
      else throw new Error('Delete option not found — you may not own this post')
    })
    await tap.wait(1000)

    // Confirm deletion
    await tap.eval(() => {
      const btn = document.querySelector('[data-testid="confirmationSheetConfirm"]')
      if (btn) btn.click()
      else throw new Error('Confirmation dialog not found')
    })
    await tap.wait(2000)

    return [{ status: 'deleted', url: String(args.url) }]
  }
}
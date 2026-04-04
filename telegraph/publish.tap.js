export default {
  site: "telegraph",
  name: "publish",
  description: "Publish anonymous Telegraph article (call nav first)",
  columns: ["status", "url"],
  args: {
    title: { type: "string", default: "Untitled" },
    author: { type: "string", default: "" },
    content: { type: "string", default: "" }
  },

  async run(tap, args) {
    // Write title via Quill API
    await tap.eval((title) => {
      quill.setText('\n')
      quill.insertText(0, title, { header: 1 })
    }, args.title)

    // Write author if provided
    if (args.author) {
      await tap.eval((author) => {
        const addr = document.querySelector('.ql-editor address')
        const a = addr.querySelector('a') || document.createElement('a')
        a.textContent = author
        if (!addr.contains(a)) addr.appendChild(a)
        addr.classList.remove('empty')
      }, args.author)
    }

    // Write body content
    if (args.content) {
      await tap.eval((content) => {
        quill.insertText(quill.getLength() - 1, content)
      }, args.content)
    }

    await tap.wait(500)

    // Force publish button visible, then click
    await tap.eval(() => {
      document.querySelector('#_publish_button').style.cssText =
        'visibility: visible !important; display: inline-block !important;'
    })
    await tap.wait(300)
    await tap.click("#_publish_button")
    await tap.wait(3000)

    // Check result
    const url = await tap.eval(() => location.href)
    const published = url !== 'https://telegra.ph/' && url.includes('telegra.ph/')

    return [{
      status: published ? 'published' : 'failed',
      url: String(url)
    }]
  }
}

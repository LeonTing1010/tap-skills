export default {
  site: "jimeng",
  name: "generate",
  intent: "read",
  description: "Jimeng AI text-to-image generation (call nav first)",
  columns: ["status", "prompt"],
  args: {
    prompt: { type: "string" }
  },

  async tap(tap, args) {
    // Use Tiptap editor API to insert text — CDP keyboard events cause detach on this page
    await tap.eval((prompt) => {
      const editor = document.querySelector('.tiptap.ProseMirror')?.editor
      if (!editor) throw new Error('Tiptap editor not found')
      editor.commands.clearContent()
      editor.commands.insertContent(prompt)
    }, args.prompt)

    // Wait for React to process the update and enable the submit button
    const submitted = await tap.eval(() => {
      return new Promise((resolve) => {
        let attempts = 0
        const tryClick = () => {
          const btn = document.querySelector('.lv-btn-primary')
          if (!btn) { resolve('no-button'); return }
          if (!btn.disabled) {
            btn.click()
            resolve('submitted')
            return
          }
          if (attempts++ > 20) { resolve('button-disabled'); return }
          setTimeout(tryClick, 200)
        }
        tryClick()
      })
    })

    return [{ status: submitted, prompt: args.prompt.substring(0, 80) }]
  }
}

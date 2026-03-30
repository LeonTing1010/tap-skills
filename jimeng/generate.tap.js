export default {
  site: "jimeng",
  name: "generate",
  description: "即梦AI 文生图 — 提交 prompt 触发生成（需先调用 jimeng/nav）",
  columns: ["status", "prompt"],
  args: {
    prompt: { type: "string" }
  },

  async run(page, args) {
    // Type prompt via CDP keyboard events into ProseMirror editor
    await page.type('[role="textbox"]', args.prompt)
    await page.wait(500)

    // Wait for submit button to become enabled, then JS-click to avoid CDP detach
    const submitted = await page.eval(() => {
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

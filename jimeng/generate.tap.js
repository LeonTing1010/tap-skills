export default {
  site: "jimeng",
  name: "generate",
  description: "即梦AI 文生图 — 填写 prompt 并回车触发生成，等待完成",
  columns: ["status", "prompt", "image_count"],
  args: {
    prompt: { type: "string" }
  },

  async run(page, args) {
    // Ensure we're on the generate page
    const url = await page.eval(() => location.href)
    if (!url.includes('jimeng.jianying.com')) {
      await page.nav("https://jimeng.jianying.com/ai-tool/image/generate")
      await page.waitFor('.tiptap', 10000)
      await page.wait(1000)
    }

    // Fill prompt via execCommand (ProseMirror editor)
    await page.eval((prompt) => {
      const editor = document.querySelector('.tiptap.ProseMirror')
      if (!editor) throw new Error('prompt editor not found')
      editor.focus()
      document.execCommand('selectAll')
      document.execCommand('insertText', false, prompt)
    }, args.prompt)
    await page.wait(300)

    // Verify prompt was filled
    const promptText = await page.eval(() => {
      const editor = document.querySelector('.tiptap.ProseMirror')
      return editor ? editor.textContent.trim() : ''
    })
    if (promptText.length < 2) {
      return [{ status: 'error: prompt not filled', prompt: args.prompt.substring(0, 80), image_count: '0' }]
    }

    // Press Enter to trigger generation
    await page.pressKey('Enter')
    await page.wait(2000)

    // Verify generation started by checking for "再次生成" disappearing or loading state
    const genStatus = await page.eval(() => {
      const regenerate = Array.from(document.querySelectorAll('div')).find(d =>
        d.textContent.trim() === '再次生成' && d.getBoundingClientRect().y > 0 && d.getBoundingClientRect().y < 600
      )
      return regenerate ? 'generating' : 'submitted'
    })

    // Wait for completion (poll for "再次生成" button to appear)
    const completed = await page.eval(() => {
      return new Promise(resolve => {
        let attempts = 0
        const check = setInterval(() => {
          attempts++
          const btn = Array.from(document.querySelectorAll('div')).find(d =>
            d.textContent.trim() === '再次生成' && d.getBoundingClientRect().y > 0 && d.getBoundingClientRect().y < 600
          )
          if (btn || attempts > 90) {
            clearInterval(check)
            resolve(btn ? 'completed' : 'timeout')
          }
        }, 2000)
      })
    })

    return [{
      status: completed,
      prompt: args.prompt.substring(0, 80),
      image_count: '4'
    }]
  }
}

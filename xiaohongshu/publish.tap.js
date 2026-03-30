export default {
  site: "xiaohongshu",
  name: "publish",
  description: "发布小红书图文笔记（需先调用 xiaohongshu/nav_publish）",
  columns: ["status", "url"],
  args: {
    title: { type: "string", default: "" },
    content: { type: "string", default: "" },
    images: { type: "string", description: "逗号分隔的本地图片路径" }
  },

  async run(page, args) {
    // Switch to image mode
    await page.eval(() => {
      const tabs = Array.from(document.querySelectorAll('span.title'))
      const imgTab = tabs.find(t => t.textContent.trim() === '上传图文' && t.getBoundingClientRect().x > 0)
      if (imgTab) imgTab.click()
      else throw new Error('上传图文 tab not found')
    })
    await page.wait(2000)

    // Verify image upload input appeared
    const hasInput = await page.eval(() => !!document.querySelector('input[type="file"][accept*="jpg"]'))
    if (!hasInput) return [{ status: 'error: image mode not activated', url: '' }]

    // Upload images
    await page.upload('input[type="file"][accept*="jpg"]', args.images)

    // Wait for upload and editor to be ready
    const ready = await page.eval(() => {
      return new Promise(resolve => {
        let attempts = 0
        const check = setInterval(() => {
          attempts++
          const titleInput = document.querySelector('[placeholder*="标题"]')
          if (titleInput || attempts > 60) {
            clearInterval(check)
            resolve(!!titleInput)
          }
        }, 500)
      })
    })
    if (!ready) return [{ status: 'error: upload timeout', url: '' }]
    await page.wait(1000)

    // Fill title via execCommand (works with both input and contenteditable)
    if (args.title) {
      await page.eval((title) => {
        const input = document.querySelector('[placeholder*="标题"]')
        if (!input) throw new Error('title input not found')
        input.focus()
        document.execCommand('selectAll')
        document.execCommand('insertText', false, title)
      }, args.title)
      await page.wait(300)

      // Verify title length (max 20 chars for xiaohongshu)
      const titleLen = await page.eval(() => {
        const tip = document.querySelector('.count-tip')
        return tip ? tip.textContent.trim() : ''
      })
      if (titleLen.includes('/')) {
        const parts = titleLen.split(/\s*\/\s*/)
        if (parseInt(parts[0]) > parseInt(parts[1])) {
          return [{ status: `error: title too long (${titleLen})`, url: '' }]
        }
      }
    }

    // Fill content
    if (args.content) {
      await page.eval((content) => {
        const editor = document.querySelector('[contenteditable="true"]')
        if (!editor) throw new Error('content editor not found')
        editor.focus()
        document.execCommand('selectAll')
        document.execCommand('insertText', false, content)
      }, args.content)
      await page.wait(300)
    }

    // Click the bottom "发布" button (avoid left nav "发布笔记")
    const clicked = await page.eval(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent.trim() === '发布' && b.getBoundingClientRect().y > 700 && b.offsetParent !== null
      )
      if (btn) { btn.click(); return true }
      return false
    })
    if (!clicked) return [{ status: 'error: publish button not found', url: '' }]

    // Wait and verify
    const result = await page.eval(() => {
      return new Promise(resolve => {
        let attempts = 0
        const check = setInterval(() => {
          attempts++
          if (location.href.includes('success') || location.href.includes('published') || attempts > 30) {
            clearInterval(check)
            resolve(location.href)
          }
        }, 1000)
      })
    })

    return [{
      status: result.includes('success') ? 'published' : 'check-browser',
      url: result
    }]
  }
}

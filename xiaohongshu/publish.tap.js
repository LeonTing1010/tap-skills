export default {
  site: "xiaohongshu",
  name: "publish",
  description: "发布小红书图文笔记（需先调用 xiaohongshu/nav_publish）",
  columns: ["status", "url"],
  args: {
    title: { type: "string", default: "" },
    content: { type: "string", default: "" },
    images: { type: "string" }
  },

  async run(page, args) {
    // XHS title limit: 20 chars
    const title = args.title.length > 20 ? args.title.substring(0, 20) : args.title

    // JS click "上传图文" — CDP pointer (page.click) causes detach on this page
    await page.eval(() => {
      const el = Array.from(document.querySelectorAll('*'))
        .find(e => e.children.length === 0 && e.innerText?.trim() === '上传图文')
      el?.click()
    })
    await page.wait(2000)

    await page.upload("input.upload-input", args.images)

    // Wait for upload to complete
    const uploaded = await page.eval(() => {
      return new Promise((resolve) => {
        let attempts = 0
        const check = () => {
          const preview = document.querySelector('.upload-item img, .coverImg, [class*="cover"] img, [class*="preview"] img')
          if (preview || attempts > 60) {
            resolve(!!preview)
            return
          }
          attempts++
          setTimeout(check, 500)
        }
        check()
      })
    })

    if (!uploaded) {
      return [{ status: 'upload-timeout', url: '' }]
    }

    await page.wait(1000)

    if (title) {
      // React native setter — direct .value assignment doesn't update component state
      await page.eval((t) => {
        const input = document.querySelector('input.d-text')
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        setter.call(input, t)
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }, title)
      await page.wait(300)
    }

    if (args.content) {
      await page.eval((text) => {
        const editor = document.querySelector('.tiptap.ProseMirror')
        editor?.focus()
        document.execCommand('selectAll')
        document.execCommand('insertText', false, text)
      }, args.content)
      await page.wait(300)
    }

    // Monitor toasts before clicking publish to catch validation errors
    await page.eval(() => {
      window.__tapToast = []
      window.__tapToastObserver = new MutationObserver(mutations => {
        for (const m of mutations) {
          for (const node of m.addedNodes) {
            if (node.nodeType === 1) {
              const text = node.innerText?.trim()
              if (text) window.__tapToast.push(text.substring(0, 100))
            }
          }
        }
      })
      window.__tapToastObserver.observe(document.body, { childList: true, subtree: true })
    })

    // JS click "发布" — CDP pointer causes detach on this page
    await page.eval(() => {
      const btn = Array.from(document.querySelectorAll('button'))
        .find(e => e.innerText?.trim() === '发布')
      btn?.click()
    })

    await page.wait(5000)

    const result = await page.eval(() => {
      window.__tapToastObserver?.disconnect()
      const url = location.href
      const toastErr = (window.__tapToast || [])
        .find(t => t.includes('错误') || t.includes('失败') || t.includes('最多') || t.includes('请'))
      return { url, toastErr: toastErr || null }
    })

    if (result.toastErr) {
      return [{ status: 'error: ' + result.toastErr, url: result.url }]
    }

    return [{
      status: result.url.includes('published=true') ? 'published' : 'check-browser',
      url: result.url
    }]
  }
}

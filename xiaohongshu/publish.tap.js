export default {
  site: "xiaohongshu",
  name: "publish",
  description: "发布小红书图文笔记",
  columns: ["status", "url"],
  args: {
    title: { type: "string", default: "" },
    content: { type: "string", default: "" },
    images: { type: "string" }
  },

  async run(tap, args) {
    // XHS title limit: 20 chars
    const title = args.title.substring(0, 20)

    // Navigate to publish page and wait for it to be ready
    await tap.nav('https://creator.xiaohongshu.com/publish/publish')
    await tap.waitFor('.creator-tab', 10000)

    // JS click "上传图文" — CDP pointer (tap.click) causes detach on this page
    await tap.eval(() => {
      const el = Array.from(document.querySelectorAll('*'))
        .find(e => e.children.length === 0 && e.innerText?.trim() === '上传图文')
      el?.click()
    })

    // Poll for upload input readiness — fixed wait(2000) is unreliable
    await tap.waitFor('input.upload-input', 5000)

    await tap.upload('input.upload-input', args.images)

    // Poll for image preview — confirms upload completed
    const uploaded = await tap.eval(() => {
      return new Promise((resolve) => {
        let n = 0
        const check = () => {
          const preview = document.querySelector('.upload-item img, .coverImg, [class*="cover"] img, [class*="preview"] img')
          if (preview || n++ > 60) resolve(!!preview)
          else setTimeout(check, 500)
        }
        check()
      })
    })

    if (!uploaded) return [{ status: 'upload-timeout', url: '' }]

    // Fill content FIRST — editor.focus() steals focus; title must be set after
    if (args.content) {
      await tap.eval((text) => {
        const editor = document.querySelector('.tiptap.ProseMirror')
        editor?.focus()
        document.execCommand('selectAll')
        document.execCommand('insertText', false, text)
      }, args.content)
      await tap.wait(300)
    }

    // Fill title LAST — React native setter; CDP tap.type causes detach
    if (title) {
      await tap.eval((t) => {
        const input = document.querySelector('input.d-text')
        input?.focus()
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        setter.call(input, t)
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }, title)
      await tap.wait(500)
    }

    // Monitor toasts before clicking publish to surface validation errors immediately
    await tap.eval(() => {
      window.__tapToast = []
      window.__tapToastObserver = new MutationObserver(ms => {
        for (const m of ms) for (const n of m.addedNodes)
          if (n.nodeType === 1 && n.innerText?.trim())
            window.__tapToast.push(n.innerText.trim().substring(0, 100))
      })
      window.__tapToastObserver.observe(document.body, { childList: true, subtree: true })
    })

    // JS click "发布" — CDP pointer causes detach on this page
    await tap.eval(() => {
      const btn = Array.from(document.querySelectorAll('button'))
        .find(e => e.innerText?.trim() === '发布')
      btn?.click()
    })

    await tap.wait(5000)

    const result = await tap.eval(() => {
      window.__tapToastObserver?.disconnect()
      const url = location.href
      const toastErr = (window.__tapToast || [])
        .find(t => t.includes('错误') || t.includes('失败') || t.includes('最多') || t.includes('请'))
      return { url, toastErr: toastErr || null }
    })

    if (result.toastErr) return [{ status: 'error: ' + result.toastErr, url: result.url }]

    const published = result.url.includes('published=true') || result.url.includes('/publish/success')
    return [{ status: published ? 'published' : 'check-browser', url: result.url }]
  }
}

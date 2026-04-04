export default {
  site: "zhihu",
  name: "publish",
  description: "Publish article on Zhihu column",
  columns: ["status", "url"],
  args: {
    title: { type: "string" },
    content: { type: "string", description: "HTML or plain text content" },
    column: { type: "string", description: "Column ID (optional, publishes to personal column if omitted)" },
    topics: { type: "string", description: "Comma-separated topic names (optional)" }
  },

  async run(tap, args) {
    if (!args.title || !args.content) {
      return [{ status: "error", url: "缺少 title 或 content 参数" }]
    }

    // Try API-first approach
    await tap.nav("https://zhuanlan.zhihu.com/write")
    await tap.wait(3000)

    // Check if redirected to login
    const url = await tap.eval(() => location.href)
    if (url.includes('signin') || url.includes('login')) {
      return [{ status: "need-login", url }]
    }

    // API approach: create draft then publish
    const apiResult = await tap.eval(`(async () => {
      try {
        // Step 1: Create draft
        const draftRes = await fetch('https://zhuanlan.zhihu.com/api/articles/drafts', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: ${JSON.stringify(args.title)},
            content: ${JSON.stringify(args.content)},
            delta_time: 0
          })
        });
        if (!draftRes.ok) return JSON.stringify({ err: 'draft-create-failed', status: draftRes.status });
        const draft = await draftRes.json();
        const draftId = draft.id;
        if (!draftId) return JSON.stringify({ err: 'no-draft-id', data: draft });

        // Step 2: Update content
        await fetch('https://zhuanlan.zhihu.com/api/articles/' + draftId + '/draft', {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: ${JSON.stringify(args.title)},
            content: ${JSON.stringify(args.content)}
          })
        });

        // Step 3: Publish
        const pubRes = await fetch('https://zhuanlan.zhihu.com/api/articles/' + draftId + '/publish', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: ${JSON.stringify(args.title)},
            content: ${JSON.stringify(args.content)},
            column: ${args.column ? JSON.stringify(args.column) : 'null'},
            topic_url_tokens: []
          })
        });
        if (!pubRes.ok) return JSON.stringify({ err: 'publish-failed', status: pubRes.status });
        return JSON.stringify({ ok: true, id: draftId });
      } catch(e) {
        return JSON.stringify({ err: e.message });
      }
    })()`)

    const result = JSON.parse(apiResult)

    if (result.ok) {
      return [{
        status: "published",
        url: 'https://zhuanlan.zhihu.com/p/' + result.id
      }]
    }

    // Fallback: DOM-based approach
    await tap.click('textarea[placeholder*="标题"], .WriteIndex-titleInput textarea')
    await tap.wait(300)
    await tap.type('textarea[placeholder*="标题"], .WriteIndex-titleInput textarea', args.title)
    await tap.wait(500)

    await tap.click('[contenteditable="true"]')
    await tap.wait(300)
    await tap.type('[contenteditable="true"]', args.content)
    await tap.wait(1000)

    await tap.click('发布')
    await tap.wait(5000)

    const finalUrl = await tap.eval(() => location.href)
    return [{
      status: finalUrl.includes('/p/') ? "published" : "check-browser",
      url: finalUrl
    }]
  }
}

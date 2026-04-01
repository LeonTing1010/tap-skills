export default {
  site: "juejin",
  name: "publish",
  description: "在掘金发布文章（API 方式）",
  columns: ["status", "url"],
  args: {
    title: { type: "string" },
    content: { type: "string", description: "Markdown content" },
    category: { type: "string", description: "分类: 后端/前端/Android/iOS/人工智能/开发工具/代码人生/阅读 (default: 前端)" },
    tags: { type: "string", description: "Comma-separated tag keywords to search (optional)" },
    brief: { type: "string", description: "摘要 (optional, max 100 chars)" }
  },

  async run(tap, args) {
    if (!args.title || !args.content) {
      return [{ status: "error", url: "缺少 title 或 content 参数" }]
    }

    await tap.nav("https://juejin.cn")
    await tap.wait(2000)

    // Category ID mapping
    const categoryMap = {
      "后端": "6809637769959178254",
      "前端": "6809637767543259144",
      "Android": "6809635626879549454",
      "iOS": "6809635626661445640",
      "人工智能": "6809637773935378440",
      "开发工具": "6809637771511070734",
      "代码人生": "6809637776263217160",
      "阅读": "6809637772874219534"
    }
    const categoryId = categoryMap[args.category] || categoryMap["前端"]

    // Search for tag IDs if provided
    let tagIds = []
    if (args.tags) {
      const keywords = args.tags.split(',').map(t => t.trim())
      for (const kw of keywords) {
        const tagResult = await tap.eval(`
          fetch('https://api.juejin.cn/tag_api/v1/query_tag_list', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key_word: "${kw}", cursor: "0", sort_type: 1, limit: 1 })
          }).then(r => r.json()).then(d => d.data?.[0]?.tag_id || '')
        `)
        if (tagResult) tagIds.push(tagResult)
      }
    }
    // Juejin requires at least one tag
    if (tagIds.length === 0) {
      const defaultTag = await tap.eval(`
        fetch('https://api.juejin.cn/tag_api/v1/query_tag_list', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key_word: "前端", cursor: "0", sort_type: 1, limit: 1 })
        }).then(r => r.json()).then(d => d.data?.[0]?.tag_id || '')
      `)
      if (defaultTag) tagIds.push(defaultTag)
    }

    // Step 1: Create draft
    const draftResult = await tap.eval(`
      fetch('https://api.juejin.cn/content_api/v1/article_draft/create', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: "${categoryId}",
          tag_ids: ${JSON.stringify(tagIds)},
          link_url: "", cover_image: "",
          title: ${JSON.stringify(args.title)},
          brief_content: ${JSON.stringify(args.brief || "")},
          edit_type: 10,
          html_content: "deprecated",
          mark_content: ${JSON.stringify(args.content)},
          theme_ids: []
        })
      }).then(r => r.json()).then(d => JSON.stringify({ err: d.err_no, id: d.data?.id }))
    `)

    const draft = JSON.parse(draftResult)
    if (draft.err !== 0 || !draft.id) {
      return [{ status: "draft-failed", url: draftResult }]
    }

    // Step 2: Update draft with tags (in case create didn't persist them)
    await tap.eval(`
      fetch('https://api.juejin.cn/content_api/v1/article_draft/update', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: "${draft.id}",
          category_id: "${categoryId}",
          tag_ids: ${JSON.stringify(tagIds)},
          link_url: "", cover_image: "",
          title: ${JSON.stringify(args.title)},
          brief_content: ${JSON.stringify(args.brief || "")},
          edit_type: 10,
          html_content: "deprecated",
          mark_content: ${JSON.stringify(args.content)},
          theme_ids: []
        })
      }).then(r => r.json())
    `)

    // Step 3: Publish
    const pubResult = await tap.eval(`
      fetch('https://api.juejin.cn/content_api/v1/article/publish', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft_id: "${draft.id}",
          sync_to_org: false,
          column_ids: [], theme_ids: [],
          encrypted_word_count: 0
        })
      }).then(r => r.json()).then(d => JSON.stringify({ err: d.err_no, msg: d.err_msg, article_id: d.data?.article_id }))
    `)

    const pub = JSON.parse(pubResult)
    if (pub.err === 0 && pub.article_id) {
      return [{
        status: "published",
        url: `https://juejin.cn/post/${pub.article_id}`
      }]
    }

    return [{ status: "failed", url: pub.msg || pubResult }]
  }
}

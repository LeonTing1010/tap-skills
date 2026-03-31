export default {
  site: "scys",
  name: "research",
  description: "搜索生财有术并提取飞书文档链接（组合 search + article tap）",
  args: {
    keyword: { type: "string", description: "搜索关键词" },
    limit:   { type: "int",    description: "提取飞书链接的文章数量，默认5", required: false }
  },
  health: { min_rows: 1, non_empty: ["title"] },

  async run(page, args) {
    const keyword = String(args.keyword || "")
    if (!keyword) return [{ title: "ERROR: keyword required", feishu: "", url: "", badge: "", date: "", preview: "" }]
    const limit = parseInt(args.limit || "5", 10)

    // Step 1: 调用 search tap 获取搜索结果
    const searchRows = await page.tap("scys", "search", { keyword })

    // 过滤掉 summary 行
    const articles = searchRows.filter(r => r.badge !== "summary")
    if (articles.length === 0) {
      return [{ title: "无搜索结果", feishu: "", url: "", badge: "", date: "", preview: "" }]
    }

    // Step 2: 对 top N 篇调用 article tap 提取飞书链接
    const results = []
    const topN = articles.slice(0, limit)

    for (const article of topN) {
      const articleRows = await page.tap("scys", "article", { url: article.url })
      const feishuRow = articleRows.find(r => r.type === "feishu_link")

      results.push({
        title:   article.title,
        feishu:  feishuRow ? feishuRow.content : "",
        url:     article.url,
        badge:   article.badge,
        date:    article.date,
        preview: article.preview
      })
    }

    // 补充剩余结果（不提取飞书链接）
    for (let i = limit; i < articles.length; i++) {
      results.push({
        title:   articles[i].title,
        feishu:  "",
        url:     articles[i].url,
        badge:   articles[i].badge,
        date:    articles[i].date,
        preview: articles[i].preview
      })
    }

    return results
  }
}

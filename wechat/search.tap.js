export default {
  site: "wechat",
  name: "search",
  intent: "read",
  description: "Search WeChat articles via Sogou search",
  columns: ["title", "author", "description", "url"],
  args: {
    keyword: { type: "string" },
    limit: { type: "int", default: 20 }
  },
  health: { min_rows: 3, non_empty: ["title"] },

  async tap(tap, args) {
    const keyword = encodeURIComponent(args.keyword)
    await tap.nav(`https://weixin.sogou.com/weixin?type=2&query=${keyword}`)
    await tap.waitFor(".news-list li, .news-box li, .txt-box", 10000)
    await tap.wait(2000)

    const limit = args.limit || 20
    const results = await tap.eval((limit) => {
      const items = []
      const articles = document.querySelectorAll('.news-list li, .news-box li')
      for (let i = 0; i < Math.min(articles.length, limit); i++) {
        const el = articles[i]
        const titleEl = el.querySelector('h3 a, .txt-box h3 a, .tit a')
        const authorEl = el.querySelector('.account, .s-p a, .wx-rb .from a, .s2')
        const descEl = el.querySelector('.txt-info, .txt-box p, .s-p')
        const linkEl = titleEl

        const title = (titleEl?.innerText || '').trim()
        if (!title) continue

        items.push({
          title,
          author: (authorEl?.innerText || '').trim(),
          description: (descEl?.innerText || '').trim().substring(0, 200),
          url: linkEl?.href || ''
        })
      }
      return items
    }, limit)

    return results.length > 0 ? results : [{ title: "", author: "", description: "no results found", url: "" }]
  }
}

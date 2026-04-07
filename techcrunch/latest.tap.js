export default {
  site: "techcrunch",
  name: "latest",
  intent: "read",
  description: "TechCrunch latest articles",
  url: "https://techcrunch.com/",
  waitFor: "article, .post-block, [class*='post-card']",
  timeout: 15000,
  health: { min_rows: 5, non_empty: ["title"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = (args) => {
    const items = []
    const seen = new Set()

    // Strategy 1: article elements (TechCrunch WordPress layout)
    const articles = document.querySelectorAll('article.post-block, article[class*="post"], .post-block')
    if (articles.length > 0) {
      articles.forEach(article => {
        const titleEl = article.querySelector('h2 a, h3 a, .post-block__title a, [class*="title"] a')
        const title = titleEl?.textContent?.trim() || ''
        const link = titleEl?.href || ''
        const authorEl = article.querySelector('.river-byline__authors a, [class*="author"] a, [rel="author"]')
        const author = authorEl?.textContent?.trim() || ''
        const dateEl = article.querySelector('time, .river-byline__full-date-time, [datetime]')
        const date = dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim() || ''
        const summaryEl = article.querySelector('.post-block__content, p, [class*="excerpt"]')
        const summary = summaryEl?.textContent?.trim() || ''

        if (title && !seen.has(title)) {
          seen.add(title)
          items.push({ title, author, date, summary: summary.substring(0, 300), link })
        }
      })
      return items
    }

    // Strategy 2: modern card-based layout
    const cards = document.querySelectorAll('[class*="post-card"], [class*="article-card"], .loop-card')
    cards.forEach(card => {
      const titleEl = card.querySelector('h2 a, h3 a, a[class*="title"]')
      const title = titleEl?.textContent?.trim() || ''
      const link = titleEl?.href || ''
      const authorEl = card.querySelector('[class*="author"] a, [rel="author"]')
      const author = authorEl?.textContent?.trim() || ''
      const dateEl = card.querySelector('time, [datetime]')
      const date = dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim() || ''
      const summaryEl = card.querySelector('p, [class*="excerpt"], [class*="description"]')
      const summary = summaryEl?.textContent?.trim() || ''

      if (title && !seen.has(title)) {
        seen.add(title)
        items.push({ title, author, date, summary: summary.substring(0, 300), link })
      }
    })

    // Strategy 3: fallback via headline links
    if (items.length < 5) {
      const headingLinks = document.querySelectorAll('h2 a[href*="techcrunch.com"], h3 a[href*="techcrunch.com"]')
      headingLinks.forEach(a => {
        const title = a.textContent.trim()
        const link = a.href || ''
        if (title && title.length > 5 && !seen.has(title)) {
          seen.add(title)
          items.push({ title, author: '', date: '', summary: '', link })
        }
      })
    }

    return items.slice(0, 25)
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

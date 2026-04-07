export default {
  site: "reuters",
  name: "news",
  intent: "read",
  description: "Reuters top news stories",
  url: "https://www.reuters.com/",
  waitFor: "a[href*='/article/'], [data-testid='Heading']",
  timeout: 15000,
  health: { min_rows: 5, non_empty: ["headline"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = (args) => {
    const items = []
    const seen = new Set()

    // Strategy 1: story cards with data-testid
    const cards = document.querySelectorAll('[data-testid="MediaStoryCard"], [data-testid="TextStoryCard"]')
    if (cards.length > 0) {
      cards.forEach(card => {
        const headlineEl = card.querySelector('[data-testid="Heading"], h3, h2')
        const headline = headlineEl?.textContent?.trim() || ''
        const summaryEl = card.querySelector('p, [data-testid="Body"]')
        const summary = summaryEl?.textContent?.trim() || ''
        const categoryEl = card.querySelector('[data-testid="Label"], [data-testid="Topic"]')
        const category = categoryEl?.textContent?.trim() || ''
        const link = card.querySelector('a')?.href || card.closest('a')?.href || ''

        if (headline && headline.length > 5 && !seen.has(headline)) {
          seen.add(headline)
          items.push({ headline, summary, category, link })
        }
      })
      return items
    }

    // Strategy 2: article links with headlines
    const articles = document.querySelectorAll('article, [class*="story-card"], [class*="StoryCard"]')
    articles.forEach(article => {
      const headlineEl = article.querySelector('h2, h3, [class*="heading"], [class*="title"]')
      const headline = headlineEl?.textContent?.trim() || ''
      const summaryEl = article.querySelector('p')
      const summary = summaryEl?.textContent?.trim() || ''
      const link = article.querySelector('a')?.href || ''
      // Infer category from URL
      const catMatch = link.match(/reuters\.com\/([a-z-]+)\//)
      const category = catMatch ? catMatch[1].replace(/-/g, ' ') : ''

      if (headline && headline.length > 5 && !seen.has(headline)) {
        seen.add(headline)
        items.push({ headline, summary, category, link })
      }
    })

    // Strategy 3: broad fallback
    if (items.length < 5) {
      const links = document.querySelectorAll('a[href*="/article/"], a[href*="/world/"], a[href*="/business/"], a[href*="/technology/"]')
      links.forEach(a => {
        const headline = a.textContent.trim()
        const link = a.href || ''
        if (headline && headline.length > 15 && headline.length < 300 && !seen.has(headline)) {
          seen.add(headline)
          const catMatch = link.match(/reuters\.com\/([a-z-]+)\//)
          const category = catMatch ? catMatch[1].replace(/-/g, ' ') : ''
          items.push({ headline, summary: '', category, link })
        }
      })
    }

    return items.slice(0, 30)
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

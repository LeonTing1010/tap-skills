export default {
  site: "bbc",
  name: "news",
  intent: "read",
  description: "BBC News top stories",
  url: "https://www.bbc.com/news",
  waitFor: "a[href*='/news/'], [data-testid='card-headline']",
  timeout: 15000,
  health: { min_rows: 5, non_empty: ["headline"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = (args) => {
    const items = []
    const seen = new Set()

    // Strategy 1: modern BBC layout (2024+) with data-testid attributes
    const cards = document.querySelectorAll('[data-testid="edinburgh-card"], [data-testid="anchor-inner-wrapper"]')
    if (cards.length > 0) {
      cards.forEach(card => {
        const headlineEl = card.querySelector('[data-testid="card-headline"], h3, h2')
        const headline = headlineEl?.textContent?.trim() || ''
        const summaryEl = card.querySelector('[data-testid="card-description"], p')
        const summary = summaryEl?.textContent?.trim() || ''
        const sectionEl = card.querySelector('[data-testid="card-metadata-tag"], span[class*="label"]')
        const section = sectionEl?.textContent?.trim() || ''
        const link = card.closest('a')?.href || card.querySelector('a')?.href || ''

        if (headline && !seen.has(headline)) {
          seen.add(headline)
          items.push({ headline, summary, section, link })
        }
      })
      return items
    }

    // Strategy 2: promo blocks (older layout)
    const promos = document.querySelectorAll('.gs-c-promo, .nw-c-promo, [class*="promo"]')
    promos.forEach(promo => {
      const headlineEl = promo.querySelector('.gs-c-promo-heading__title, h3, .nw-o-link-split__text')
      const headline = headlineEl?.textContent?.trim() || ''
      const summaryEl = promo.querySelector('.gs-c-promo-summary, p.gs-c-promo-body')
      const summary = summaryEl?.textContent?.trim() || ''
      const sectionEl = promo.querySelector('.gs-c-section-link, .nw-c-promo-meta')
      const section = sectionEl?.textContent?.trim() || ''
      const link = promo.querySelector('a')?.href || ''

      if (headline && !seen.has(headline)) {
        seen.add(headline)
        items.push({ headline, summary, section, link })
      }
    })

    // Strategy 3: fallback — news article links
    if (items.length < 5) {
      const links = document.querySelectorAll('a[href*="/news/articles/"], a[href*="/news/"]')
      links.forEach(a => {
        const headline = a.textContent.trim()
        const link = a.href || ''
        if (headline && headline.length > 15 && headline.length < 300 && !seen.has(headline)) {
          seen.add(headline)
          const parent = a.closest('div') || a.parentElement
          const summaryEl = parent?.querySelector('p')
          const summary = summaryEl?.textContent?.trim() || ''
          items.push({ headline, summary, section: '', link })
        }
      })
    }

    return items.slice(0, 30)
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

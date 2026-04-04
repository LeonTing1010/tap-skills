export default {
  site: "rottentomatoes",
  name: "opening",
  description: "Rotten Tomatoes popular movies at home",
  url: "https://www.rottentomatoes.com/browse/movies_at_home/sort:popular",
  waitFor: "a[href*='/m/'], [data-qa='discovery-media-list-item']",
  timeout: 15000,
  health: { min_rows: 5, non_empty: ["title"] },

  extract: () => {
    const items = []
    const seen = new Set()

    // Strategy 1: discovery media list items (current RT layout 2024+)
    const tiles = document.querySelectorAll(
      '[data-qa="discovery-media-list-item"], ' +
      'div[class*="discovery-tiles"] a, ' +
      '[slot="caption"]'
    )
    if (tiles.length > 0) {
      // Walk the tile containers
      const containers = document.querySelectorAll('[data-qa="discovery-media-list-item"]')
      containers.forEach(container => {
        const titleEl = container.querySelector('span[data-qa="discovery-media-list-item-title"]') ||
                        container.querySelector('[class*="title"]') ||
                        container.querySelector('span')
        const title = titleEl?.textContent?.trim() || ''

        // Score — look for tomatometer
        const scoreEl = container.querySelector('rt-text[slot="criticsScore"], score-pairs rt-text, [slot="criticsScore"]') ||
                        container.querySelector('[class*="tomatometer"], [class*="score"]')
        const score = scoreEl?.textContent?.trim() || ''

        const link = container.querySelector('a[href*="/m/"]')?.href || ''

        if (title && !seen.has(title)) {
          seen.add(title)
          items.push({ title, score, link })
        }
      })
      if (items.length > 0) return items
    }

    // Strategy 2: tile grid layout
    const movieTiles = document.querySelectorAll(
      'tiles-carousel-responsive-item, ' +
      '[class*="media-list"] li, ' +
      '.discovery-tiles__wrap a[href*="/m/"]'
    )
    movieTiles.forEach(tile => {
      const titleEl = tile.querySelector('[class*="title"], span, h3')
      const title = titleEl?.textContent?.trim() || ''
      const scoreEl = tile.querySelector('[class*="score"], rt-text')
      const score = scoreEl?.textContent?.trim() || ''
      const link = tile.querySelector('a[href*="/m/"]')?.href || tile.closest('a')?.href || ''

      if (title && title.length > 1 && !seen.has(title)) {
        seen.add(title)
        items.push({ title, score, link })
      }
    })

    // Strategy 3: broad fallback — movie links
    if (items.length < 5) {
      const allLinks = document.querySelectorAll('a[href*="/m/"]')
      allLinks.forEach(a => {
        const title = a.textContent.trim()
        const link = a.href || ''
        if (title && title.length > 2 && title.length < 200 && !seen.has(title)) {
          seen.add(title)
          items.push({ title, score: '', link })
        }
      })
    }

    return items.slice(0, 30)
  }
}

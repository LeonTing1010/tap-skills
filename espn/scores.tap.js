export default {
  site: "espn",
  name: "scores",
  description: "ESPN top headlines and scores",
  url: "https://www.espn.com/",
  waitFor: "a[href*='espn.com']",
  timeout: 15000,
  health: { min_rows: 5, non_empty: ["headline"] },

  extract: () => {
    const items = []
    const seen = new Set()

    // Strategy 1: headline containers in the main content area
    const headlineEls = document.querySelectorAll(
      '.contentItem__content h2 a, ' +
      '.headlineStack__list a, ' +
      '[class*="headline"] a, ' +
      '.content-feed a[href*="/story/"], ' +
      'a[href*="/story/"]'
    )
    headlineEls.forEach(a => {
      const headline = a.textContent.trim()
      const link = a.href || ''
      if (headline && headline.length > 10 && headline.length < 300 && !seen.has(headline)) {
        seen.add(headline)
        // Infer sport from URL path
        const sportMatch = link.match(/espn\.com\/([a-z-]+)\//)
        const sport = sportMatch ? sportMatch[1].replace(/-/g, ' ') : ''
        items.push({ headline, sport, link })
      }
    })

    // Strategy 2: score cards
    if (items.length < 5) {
      const scoreCards = document.querySelectorAll(
        '[class*="ScoreCell"], [class*="scoreboard"], .score-container a'
      )
      scoreCards.forEach(card => {
        const text = card.textContent.trim()
        const link = card.closest('a')?.href || card.querySelector('a')?.href || ''
        if (text && text.length > 5 && !seen.has(text)) {
          seen.add(text)
          const sportMatch = link.match(/espn\.com\/([a-z-]+)\//)
          const sport = sportMatch ? sportMatch[1].replace(/-/g, ' ') : ''
          items.push({ headline: text.substring(0, 200), sport, link })
        }
      })
    }

    // Strategy 3: broad fallback — any prominent links in main content
    if (items.length < 5) {
      const allLinks = document.querySelectorAll('main a[href], #main-container a[href], .page-container a[href]')
      allLinks.forEach(a => {
        const headline = a.textContent.trim()
        const link = a.href || ''
        if (headline && headline.length > 15 && headline.length < 300 &&
            !seen.has(headline) && link.includes('espn.com')) {
          seen.add(headline)
          const sportMatch = link.match(/espn\.com\/([a-z-]+)\//)
          const sport = sportMatch ? sportMatch[1].replace(/-/g, ' ') : ''
          items.push({ headline, sport, link })
        }
      })
    }

    return items.slice(0, 30)
  }
}

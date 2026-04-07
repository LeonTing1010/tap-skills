export default {
  site: "imdb",
  name: "top",
  intent: "read",
  description: "IMDB Top 250 rated movies",
  url: "https://www.imdb.com/chart/top/",
  waitFor: ".ipc-metadata-list-summary-item, .cli-children",
  timeout: 15000,
  health: { min_rows: 5, non_empty: ["title"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = (args) => {
    const items = []

    // Strategy 1: modern IMDB layout (2024+) using list items
    const listItems = document.querySelectorAll('.ipc-metadata-list-summary-item')
    if (listItems.length > 0) {
      listItems.forEach((el, i) => {
        const titleEl = el.querySelector('h3.ipc-title__text') || el.querySelector('a h3') || el.querySelector('h3')
        let titleText = titleEl?.textContent?.trim() || ''
        // Title often has format "1. The Shawshank Redemption"
        const rankMatch = titleText.match(/^(\d+)\.\s*(.+)/)
        const rank = rankMatch ? rankMatch[1] : String(i + 1)
        const title = rankMatch ? rankMatch[2] : titleText

        // Year is in metadata spans
        const spans = el.querySelectorAll('.cli-title-metadata span, .sc-b189961a-8 span')
        const year = spans[0]?.textContent?.trim() || ''

        // Rating
        const ratingEl = el.querySelector('.ipc-rating-star--rating') ||
                         el.querySelector('[data-testid="ratingGroup--imdb-rating"] span')
        const rating = ratingEl?.textContent?.trim() || ''

        if (title) {
          items.push({ rank, title, year, rating })
        }
      })
      return items
    }

    // Strategy 2: legacy table layout
    const rows = document.querySelectorAll('.lister-list tr, tbody.lister-list tr')
    rows.forEach((row, i) => {
      const titleEl = row.querySelector('.titleColumn a')
      const title = titleEl?.textContent?.trim() || ''
      const yearEl = row.querySelector('.titleColumn .secondaryInfo')
      const year = yearEl?.textContent?.replace(/[()]/g, '').trim() || ''
      const ratingEl = row.querySelector('.ratingColumn strong, .imdbRating strong')
      const rating = ratingEl?.textContent?.trim() || ''
      if (title) {
        items.push({ rank: String(i + 1), title, year, rating })
      }
    })

    // Strategy 3: generic fallback — find the list container
    if (items.length === 0) {
      const allLinks = document.querySelectorAll('a[href*="/title/tt"]')
      const seen = new Set()
      let rank = 0
      allLinks.forEach(a => {
        const title = a.textContent.trim()
        const href = a.getAttribute('href') || ''
        if (title && title.length > 2 && title.length < 200 && !seen.has(href)) {
          seen.add(href)
          rank++
          items.push({ rank: String(rank), title, year: '', rating: '' })
        }
      })
    }

    return items
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

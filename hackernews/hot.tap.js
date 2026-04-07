export default {
  site: "hackernews",
  name: "hot",
  intent: "read",
  description: "Hacker News top stories",
  url: "https://news.ycombinator.com/",
  waitFor: ".athing",
  health: { min_rows: 10, non_empty: ["title", "score"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = (args) => {
    const items = []
    document.querySelectorAll('.athing').forEach((row) => {
      const rank = (row.querySelector('.rank') || {}).textContent || ''
      const titleEl = row.querySelector('.titleline > a')
      const title = titleEl ? titleEl.textContent.trim() : ''
      const url = titleEl ? titleEl.href : ''
      const subRow = row.nextElementSibling
      const scoreEl = subRow ? subRow.querySelector('.score') : null
      const score = scoreEl ? scoreEl.textContent.replace(/[^0-9]/g, '') : '0'
      const authorEl = subRow ? subRow.querySelector('.hnuser') : null
      const author = authorEl ? authorEl.textContent : ''
      const ageEl = subRow ? subRow.querySelector('.age a') : null
      const age = ageEl ? ageEl.textContent : ''
      const links = subRow ? subRow.querySelectorAll('a') : []
      let comments = '0'
      for (const a of links) {
        const m = a.textContent.match(/(\d+)\s*comment/)
        if (m) { comments = m[1]; break }
      }
      if (title) {
        items.push({ rank: rank.replace('.', '').trim(), title, url, score, author, comments, age })
      }
    })
    return items
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

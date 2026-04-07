export default {
  site: "npmjs",
  name: "popular",
  intent: "read",
  description: "npm most popular packages by weekly downloads",
  url: "https://www.npmjs.com/browse/popular",
  waitFor: "section.ef4d7c63",
  timeout: 15000,
  health: { min_rows: 5, non_empty: ["name"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = (args) => {
    const items = []
    // Try the package list items — npm uses dynamic class names, so use multiple strategies
    const packages = document.querySelectorAll('section.ef4d7c63') ||
                     document.querySelectorAll('[class*="package-list"] section') ||
                     []
    if (packages.length === 0) {
      // Fallback: find all links that look like package links
      const links = document.querySelectorAll('a[href^="/package/"]')
      const seen = new Set()
      links.forEach(a => {
        const name = a.textContent.trim()
        if (name && !seen.has(name) && name.length < 100) {
          seen.add(name)
          const container = a.closest('section') || a.closest('div') || a.parentElement
          const desc = container?.querySelector('p')?.textContent?.trim() || ''
          items.push({ name, description: desc, downloads: '' })
        }
      })
      return items
    }
    packages.forEach(pkg => {
      const nameEl = pkg.querySelector('a[href^="/package/"]') || pkg.querySelector('h3 a') || pkg.querySelector('a')
      const name = nameEl?.textContent?.trim() || ''
      const descEl = pkg.querySelector('p')
      const description = descEl?.textContent?.trim() || ''
      // Downloads count is typically in a span near the bottom
      const spans = pkg.querySelectorAll('span')
      let downloads = ''
      for (const s of spans) {
        const t = s.textContent.trim()
        if (/[\d,]+/.test(t) && (t.includes(',') || /^\d{4,}$/.test(t.replace(/,/g, '')))) {
          downloads = t
          break
        }
      }
      if (name) {
        items.push({ name, description, downloads })
      }
    })
    return items
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

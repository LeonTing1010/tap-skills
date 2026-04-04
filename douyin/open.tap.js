export default {
  site: "douyin",
  name: "open",
  description: "Search and open Douyin video, or open by aweme_id",
  columns: ["aweme_id", "title", "author", "url"],
  args: {
    keyword: { type: "string", default: "" },
    index: { type: "int", default: 1 },
    aweme_id: { type: "string", default: "" }
  },

  async run(tap, args) {
    if (args.aweme_id) {
      const url = `https://www.douyin.com/video/${args.aweme_id}`
      await tap.nav(url)
      await tap.wait(3000)

      const info = await tap.eval(() => {
        try {
          const el = document.querySelector('#RENDER_DATA')
          if (!el) return null
          const data = JSON.parse(decodeURIComponent(el.textContent))
          for (const val of Object.values(data)) {
            const detail = val?.awemeDetail || val?.aweme?.detail
            if (detail) {
              return {
                aweme_id: detail.awemeId || detail.aweme_id || '',
                title: detail.desc || '',
                author: (detail.authorInfo || detail.author)?.nickname || '',
                url: location.href
              }
            }
          }
        } catch {}
        return null
      })

      if (info) return [info]
      return [{ aweme_id: args.aweme_id, title: "", author: "", url: location.href }]
    }

    if (!args.keyword) {
      return [{ aweme_id: "", title: "", author: "", url: "error: provide keyword or aweme_id" }]
    }

    // Use search tap to find videos
    const results = await tap.run("douyin", "search", { keyword: args.keyword })
    const idx = (args.index || 1) - 1
    if (!results || !results[idx]) {
      return [{ aweme_id: "", title: "", author: "", url: "no search results" }]
    }

    const target = results[idx]
    const urlMatch = (target.url || '').match(/video\/(\d+)/)
    const awemeId = urlMatch ? urlMatch[1] : ''

    if (!target.url) {
      return [{ aweme_id: "", title: target.title || "", author: target.author || "", url: "no video url" }]
    }

    await tap.nav(target.url)
    await tap.wait(3000)

    return [{
      aweme_id: awemeId,
      title: target.title || '',
      author: target.author || '',
      url: target.url
    }]
  }
}

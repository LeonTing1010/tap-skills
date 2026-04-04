export default {
  site: "xiaohongshu",
  name: "open",
  description: "Search and open Nth Xiaohongshu note detail",
  columns: ["note_id", "title", "author", "url"],
  args: {
    keyword: { type: "string" },
    index: { type: "int", default: 1 }
  },

  async run(tap, args) {
    await tap.nav(`https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(args.keyword)}&type=51`)
    await tap.waitFor("section.note-item", 10000)
    await tap.wait(2000)

    await tap.click(`section.note-item:nth-child(${args.index}) a.cover`)
    await tap.wait(3000)

    // Extract basic info from SSR state
    const info = await tap.eval(() => {
      const map = window.__INITIAL_STATE__?.note?.noteDetailMap || {}
      for (const [k, v] of Object.entries(map)) {
        if (!k || k === "undefined" || k === "") continue
        const note = v?.note || {}
        return {
          note_id: k,
          title: note.title || note.displayTitle || "",
          author: (note.user || {}).nickname || "",
          url: location.href
        }
      }
      return null
    })

    if (!info) {
      return [{ note_id: "", title: "", author: "", url: "modal did not open" }]
    }
    return [info]
  }
}

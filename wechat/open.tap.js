export default {
  site: "wechat",
  name: "open",
  intent: "read",
  description: "Search and open WeChat article (keyword+index or URL)",
  columns: ["title", "author", "url"],
  args: {
    keyword: { type: "string", default: "" },
    index: { type: "int", default: 1 },
    url: { type: "string", default: "" }
  },

  async tap(tap, args) {
    if (args.url) {
      await tap.nav(args.url)
    } else if (args.keyword) {
      const results = await tap.run("wechat", "search", { keyword: args.keyword, limit: args.index || 5 })
      const target = results[(args.index || 1) - 1]
      if (!target || !target.url) {
        return [{ title: "", author: "", url: "no result at index " + (args.index || 1) }]
      }
      await tap.nav(target.url)
    } else {
      return [{ title: "", author: "", url: "provide keyword or url" }]
    }

    await tap.waitFor("#js_content, .rich_media_content", 10000)
    await tap.wait(2000)

    const info = await tap.eval(() => {
      const title = (document.querySelector('#activity-name')?.innerText || '').trim()
      const author = (document.querySelector('#js_name, .rich_media_meta_nickname')?.innerText || '').trim()
      return {
        title,
        author,
        url: location.href
      }
    })

    return [info]
  }
}

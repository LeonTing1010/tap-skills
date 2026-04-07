export default {
  site: "pixiv",
  name: "ranking",
  intent: "read",
  description: "Pixiv daily illustration ranking",
  url: "https://www.pixiv.net",
  health: { min_rows: 5, non_empty: ["title"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch("https://www.pixiv.net/ranking.php?mode=daily&content=all&p=1&format=json", { credentials: 'include' })
    const data = await res.json()
    const contents = data.contents || []
    return contents.map(item => ({
      rank: String(item.rank),
      title: String(item.title),
      author: String(item.user_name),
      views: String(item.view_count)
    }))
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

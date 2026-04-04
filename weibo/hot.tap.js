export default {
  site: "weibo",
  name: "hot",
  description: "Weibo hot search trending topics",
  url: "https://weibo.com",

  extract: async () => {
    const res = await fetch('https://weibo.com/ajax/side/hotSearch')
    const data = await res.json()
    return data.data.realtime.map((item, i) => ({
      rank: i + 1,
      title: item.note,
      hot: item.num || 0
    }))
  }
}

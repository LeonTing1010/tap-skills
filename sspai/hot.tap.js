export default {
  site: "sspai",
  name: "hot",
  description: "Sspai trending articles",
  url: "https://sspai.com",
  health: { min_rows: 5, non_empty: ["title", "author"] },

  extract: async () => {
    const res = await fetch('https://sspai.com/api/v1/article/hot/page/get?offset=0&limit=20&created_at=' + Math.floor(Date.now()/1000))
    const data = await res.json()
    if (data.error !== 0 || !Array.isArray(data.data)) return []
    return data.data.map((a, i) => ({
      rank: String(i + 1),
      title: String(a.title || ''),
      author: String(a.author?.nickname || ''),
      likes: String(a.like_count || 0),
      comments: String(a.comment_count || 0),
      url: 'https://sspai.com/post/' + a.id
    }))
  }
}

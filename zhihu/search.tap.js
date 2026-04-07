export default {
  site: "zhihu",
  name: "search",
  intent: "read",
  description: "Search Zhihu with title, likes, author",
  url: "https://www.zhihu.com",
  args: { keyword: { type: "string" } },
  health: { min_rows: 3, non_empty: ["title"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    try {
      const params = new URLSearchParams({
        t: 'general',
        q: args.keyword,
        correction: '1',
        offset: '0',
        limit: '20'
      })
      const res = await fetch(
        'https://www.zhihu.com/api/v4/search_v3?' + params.toString(),
        { credentials: 'include' }
      )
      const data = await res.json()
      return (data.data || [])
        .filter(item => item.object)
        .map(item => {
          const obj = item.object
          const title = (obj.title || obj.question?.title || '')
            .replace(/<[^>]+>/g, '').trim()
          const voteup = obj.voteup_count || obj.answer_count || 0
          const author = obj.author?.name || ''
          const url = obj.url
            ? obj.url.replace('api.zhihu.com/questions', 'zhihu.com/question')
                .replace('api.zhihu.com/answers', 'zhihu.com/answer')
            : ''
          return { title, likes: String(voteup), author, url }
        })
        .filter(item => item.title.length > 0)
    } catch (e) {
      return [{ title: 'Error: ' + e.message, likes: '0', author: '', url: '' }]
    }
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

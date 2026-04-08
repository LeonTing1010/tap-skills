export default {
  site: "scys",
  name: "extract-results",
  intent: "read",
  description: "Extract search results from SCYS Pinia store (requires login)",
  columns: ["title", "author", "url", "badge", "date", "preview"],
  health: { min_rows: 1, non_empty: ["title"] },

  async tap(tap, args) {
    return await tap.eval(() => {
      var allEls = document.querySelectorAll('*')
      var vueApp = null
      for (var i = 0; i < allEls.length; i++) {
        var keys = Object.keys(allEls[i])
        for (var j = 0; j < keys.length; j++) {
          if (keys[j].indexOf('__vue_app__') === 0) { vueApp = allEls[i][keys[j]]; break }
        }
        if (vueApp) break
      }
      if (!vueApp) return [{ title: 'ERROR: Vue app not found', author: '', url: '', badge: '', date: '', preview: '' }]

      var provides = vueApp._context.provides
      var symbols = Object.getOwnPropertySymbols(provides)
      var pinia = null
      for (var s = 0; s < symbols.length; s++) {
        if (provides[symbols[s]] && provides[symbols[s]]._s) { pinia = provides[symbols[s]]; break }
      }
      if (!pinia) return [{ title: 'ERROR: Pinia not found', author: '', url: '', badge: '', date: '', preview: '' }]

      var store = pinia._s.get('searchContentStore')
      if (!store) return [{ title: 'ERROR: store not found', author: '', url: '', badge: '', date: '', preview: '' }]

      var startTime = Date.now()
      while (Date.now() - startTime < 10000) {
        if (store.postList && store.postList.length > 0) break
        var end = Date.now() + 500
        while (Date.now() < end) { /* busy wait */ }
      }

      var postList = store.postList || []
      var total = store.total || 0
      var scenes = store.pageSceneList || []

      var summary = {
        title: '共' + total + '条',
        author: '', url: '', badge: 'summary', date: '',
        preview: scenes.map(function(s) { return s.name + '(' + s.count + ')' }).join(' ')
      }

      var rows = postList.map(function(p) {
        return {
          title:   (p.showTitle || p.title || '').replace(/<[^>]+>/g, ''),
          author:  p.authorName || p.nickName || '',
          url:     'https://scys.com/articleDetail/' + (p.entityType || 'xq_topic') + '/' + (p.topicId || ''),
          badge:   p.isDigested ? '精华' : '',
          date:    p.createDate || '',
          preview: (p.content || '').replace(/<[^>]+>/g, '').substring(0, 200)
        }
      })

      rows.unshift(summary)
      return rows
    })
  }
}

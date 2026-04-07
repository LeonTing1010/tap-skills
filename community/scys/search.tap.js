export default {
  site: "scys",
  name: "search",
  intent: "write",
  description: "Search Shengcaiyoushu content by keyword",
  columns: ["title", "author", "url", "badge", "date", "preview"],
  args: {
    keyword: { type: "string", description: "搜索关键词" }
  },
  health: { min_rows: 1, non_empty: ["title"] },

  async tap(tap, args) {
    const keyword = String(args.keyword || "")
    if (!keyword) return [{ title: "ERROR: keyword required", author: "", url: "", badge: "", date: "", preview: "" }]

    // 1. 打开首页
    await tap.nav("https://scys.com")
    await tap.wait(2000)

    // 2. 输入关键词
    await tap.type('input[placeholder="搜索内容、用户、航海..."]', keyword)
    await tap.wait(500)

    // 3. 通过 eval 触发搜索（多种方式尝试）
    await tap.eval(() => {
      // 方式1: 找到 Vue 组件实例，直接调用搜索方法
      var allEls = document.querySelectorAll('*')
      var vueApp = null
      for (var i = 0; i < allEls.length; i++) {
        var keys = Object.keys(allEls[i])
        for (var j = 0; j < keys.length; j++) {
          if (keys[j].indexOf('__vue_app__') === 0) { vueApp = allEls[i][keys[j]]; break }
        }
        if (vueApp) break
      }
      if (vueApp) {
        var root = vueApp._instance
        if (root && root.subTree && root.subTree.component) {
          var comp = root.subTree.component
          function findSearchComp(c, depth) {
            if (!c || depth > 20) return null
            if (c.exposed && c.exposed.search) return c.exposed
            if (c.ctx && typeof c.ctx.search === 'function') return c.ctx
            if (c.setupState && typeof c.setupState.search === 'function') return c.setupState
            if (c.subTree && c.subTree.component) {
              var found = findSearchComp(c.subTree.component, depth + 1)
              if (found) return found
            }
            if (c.subTree && c.subTree.children) {
              for (var k = 0; k < c.subTree.children.length; k++) {
                var child = c.subTree.children[k]
                if (child && child.component) {
                  found = findSearchComp(child.component, depth + 1)
                  if (found) return found
                }
              }
            }
            return null
          }
          var searchCtx = findSearchComp(comp, 0)
          if (searchCtx && searchCtx.search) {
            searchCtx.search()
            return 'called vue search method'
          }
        }
      }
      // 方式2: 点击搜索图标
      var svg = document.querySelector('svg.search-icon')
      if (svg) {
        svg.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        return 'clicked svg search-icon'
      }
      // 方式3: 提交表单
      var form = document.querySelector('form.search-input')
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
        return 'submitted form'
      }
      return 'no search trigger found'
    })
    await tap.wait(4000)

    // 4. 轮询等待数据加载完成，然后从 Pinia store 提取
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

      // 轮询等待数据加载（最多等10秒，每500ms检查一次）
      var startTime = Date.now()
      while (Date.now() - startTime < 10000) {
        if (store.postList && store.postList.length > 0) break
        // 同步阻塞等待
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
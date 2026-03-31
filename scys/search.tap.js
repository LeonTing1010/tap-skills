export default {
  site: "scys",
  name: "search",
  description: "搜索生财有术内容，返回标题、作者、链接、摘要",
  args: {
    keyword: { type: "string", description: "搜索关键词" }
  },
  health: { min_rows: 1, non_empty: ["title"] },

  async run(page, args) {
    const keyword = String(args.keyword || "")
    if (!keyword) return [{ title: "ERROR: keyword required", author: "", url: "", badge: "", date: "", preview: "" }]

    const sleep = (ms) => page.eval(`new Promise(r => setTimeout(r, ${ms}))`)

    // 1. 打开首页
    await page.nav("https://scys.com")
    await sleep(2000)

    // 2. 点搜索框 → 输入关键词 → 点放大镜
    await page.eval(`(function(){
      var input = document.querySelector('input[type="text"]');
      input.focus();
      var setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, "${keyword.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}");
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`)

    await sleep(500)

    await page.eval(`(function(){
      var icon = document.querySelector('svg.search-icon');
      if (icon) icon.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    })()`)

    await sleep(4000)

    // 3. 从 Pinia store 提取搜索结果
    return await page.eval(`(function() {
      var allEls = document.querySelectorAll('*');
      var vueApp = null;
      for (var i = 0; i < allEls.length; i++) {
        var keys = Object.keys(allEls[i]);
        for (var j = 0; j < keys.length; j++) {
          if (keys[j].indexOf('__vue_app__') === 0) { vueApp = allEls[i][keys[j]]; break; }
        }
        if (vueApp) break;
      }
      if (!vueApp) return [{ title: 'ERROR: Vue app not found', author: '', url: '', badge: '', date: '', preview: '' }];

      var provides = vueApp._context.provides;
      var pinia = provides[Object.getOwnPropertySymbols(provides)[0]];
      var store = pinia._s.get('searchContentStore');
      if (!store) return [{ title: 'ERROR: store not found', author: '', url: '', badge: '', date: '', preview: '' }];

      var postList = store.postList || [];
      var total = store.total || 0;
      var scenes = store.pageSceneList || [];

      var summary = {
        title: '共' + total + '条',
        author: '', url: '', badge: 'summary', date: '',
        preview: scenes.map(function(s) { return s.name + '(' + s.count + ')'; }).join(' ')
      };

      var rows = postList.map(function(p) {
        return {
          title:   (p.showTitle || p.title || '').replace(/<[^>]+>/g, ''),
          author:  p.authorName || p.nickName || '',
          url:     'https://scys.com/articleDetail/' + (p.entityType || 'xq_topic') + '/' + (p.topicId || ''),
          badge:   p.isDigested ? '精华' : '',
          date:    p.createDate || '',
          preview: (p.content || '').replace(/<[^>]+>/g, '').substring(0, 200)
        };
      });

      rows.unshift(summary);
      return rows;
    })()`)
  }
}

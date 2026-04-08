export default {
  site: "scys",
  name: "trigger-search",
  intent: "write",
  description: "Trigger search on SCYS (Vue component method or form submit, requires login)",
  columns: ["status", "method"],

  async tap(tap, args) {
    const result = await tap.eval(() => {
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
            return 'vue-method'
          }
        }
      }
      var svg = document.querySelector('svg.search-icon')
      if (svg) { svg.dispatchEvent(new MouseEvent('click', { bubbles: true })); return 'svg-click' }
      var form = document.querySelector('form.search-input')
      if (form) { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); return 'form-submit' }
      return 'not-found'
    })

    await tap.wait(4000)

    return [{ status: result, method: result }]
  }
}

export default {
  site: "jimeng",
  name: "download",
  description: "Download latest Jimeng AI images locally (direct API)",
  columns: ["file", "size", "prompt"],
  args: {
    count: { type: "int", default: 4, description: "Number of images to download" },
    dir: { type: "string", default: "/tmp/jimeng", description: "Save directory (browser downloads to ~/Downloads, dir as fallback)" },
    prompt_filter: { type: "string", default: "", description: "Filter by prompt keyword, empty string gets latest" }
  },

  async run(tap, args) {
    // Ensure we're on jimeng domain for the API call
    await tap.nav("https://jimeng.jianying.com/ai-tool/generate/?type=image&workspace=0")
    await tap.wait(1000)

    // Call history API directly — no page navigation needed
    const images = await tap.eval((count, promptFilter) => {
      return fetch('/mweb/v1/get_history?aid=513695&device_platform=web&region=cn', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cursor: '',
          count: 20,
          need_page_item: true,
          need_aigc_data: true,
          aigc_mode_list: ['workbench']
        })
      })
        .then(r => r.json())
        .then(data => {
          const records = data?.data?.records_list || []
          const rows = []
          for (const rec of records) {
            for (const item of rec.item_list || []) {
              const attr = item.common_attr || {}
              const urlMap = attr.cover_url_map || {}
              const url = urlMap['1080'] || urlMap['720'] || attr.cover_url || ''
              if (!url) continue
              if (promptFilter && !attr.description?.includes(promptFilter)) continue
              rows.push({ url, prompt: attr.description || '' })
            }
          }
          return rows.slice(0, count)
        })
    }, args.count, args.prompt_filter)

    if (!images || images.length === 0) {
      return [{ file: '', size: '0', prompt: 'no images found' }]
    }

    // Download via browser fetch (uses session cookies for auth)
    const results = await tap.eval((images) => {
      return Promise.all(images.map((img, i) => {
        return fetch(img.url)
          .then(r => r.blob())
          .then(blob => {
            const ts = Date.now()
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `jimeng-${ts}-${i + 1}.webp`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(a.href)
            return { file: `jimeng-${ts}-${i + 1}.webp`, size: String(blob.size), prompt: img.prompt.substring(0, 50) }
          })
          .catch(e => ({ file: '', size: '0', prompt: 'failed: ' + e.message }))
      }))
    }, images)

    return results
  }
}

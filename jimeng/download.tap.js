export default {
  site: "jimeng",
  name: "download",
  description: "下载即梦AI最新生成的图片到本地",
  columns: ["path", "size", "prompt"],
  args: {
    count: { type: "int", default: 4, description: "下载图片数量" },
    dir: { type: "string", default: "/tmp/jimeng", description: "保存目录" }
  },

  async run(page, args) {
    // Get latest images from history
    const history = await page.tap("jimeng", "history")
    if (!history || history.length === 0) {
      return [{ path: '', size: '0', prompt: 'no images found' }]
    }

    // Take the latest N images (same created_at = same batch)
    const latest = history.slice(0, args.count)

    // Download each image via browser fetch (has auth cookies)
    const results = await page.eval((images, dir) => {
      return Promise.all(images.map(async (img, idx) => {
        try {
          const res = await fetch(img.image_url)
          const blob = await res.blob()
          // Trigger browser download
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob)
          a.download = `jimeng-${idx + 1}.webp`
          a.click()
          URL.revokeObjectURL(a.href)
          return { path: `~/Downloads/jimeng-${idx + 1}.webp`, size: String(blob.size), prompt: img.prompt.substring(0, 50) }
        } catch (e) {
          return { path: '', size: '0', prompt: 'download failed: ' + e.message }
        }
      }))
    }, latest, args.dir)

    return results
  }
}

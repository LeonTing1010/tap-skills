export default {
  site: "xiaohongshu",
  name: "nav_publish",
  intent: "write",
  description: "Navigate to Xiaohongshu publish page",
  columns: ["status", "url"],
  args: {},

  async tap(tap) {
    await tap.nav("https://creator.xiaohongshu.com/publish/publish")
    await tap.waitFor(".creator-tab", 10000)
    const url = await tap.eval(() => location.href)
    return [{ status: "ready", url }]
  }
}

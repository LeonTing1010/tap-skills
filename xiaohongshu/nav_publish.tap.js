export default {
  site: "xiaohongshu",
  name: "nav_publish",
  description: "导航到小红书发布页面",
  columns: ["status", "url"],
  args: {},

  async run(tap) {
    await tap.nav("https://creator.xiaohongshu.com/publish/publish")
    await tap.waitFor(".creator-tab", 10000)
    const url = await tap.eval(() => location.href)
    return [{ status: "ready", url }]
  }
}

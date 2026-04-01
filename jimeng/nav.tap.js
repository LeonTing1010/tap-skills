export default {
  site: "jimeng",
  name: "nav",
  description: "导航到即梦AI文生图页面",
  columns: ["status", "url"],
  args: {},

  async run(tap) {
    await tap.nav("https://jimeng.jianying.com/ai-tool/image/generate")
    await tap.waitFor('[role="textbox"], .tiptap', 20000)
    await tap.wait(1000)
    const url = await tap.eval(() => location.href)
    return [{ status: "ready", url }]
  }
}

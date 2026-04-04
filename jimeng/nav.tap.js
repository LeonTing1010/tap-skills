export default {
  site: "jimeng",
  name: "nav",
  description: "Navigate to Jimeng AI text-to-image page",
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

export default {
  site: "jimeng",
  name: "nav",
  intent: "read",
  description: "Navigate to Jimeng AI text-to-image page",
  columns: ["status", "url"],
  args: {},

  async tap(tap) {
    await tap.nav("https://jimeng.jianying.com/ai-tool/image/generate")
    await tap.waitFor('[role="textbox"], .tiptap', 20000)
    await tap.wait(1000)
    const url = await tap.eval(() => location.href)
    return [{ status: "ready", url }]
  }
}

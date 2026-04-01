export default {
  site: "telegraph",
  name: "nav",
  description: "导航到 Telegraph 编辑器并激活",
  columns: ["status", "url"],
  args: {},

  async run(tap) {
    await tap.nav("https://telegra.ph")
    await tap.wait(2000)

    // Activate Quill editor
    await tap.eval(() => { quill.enable(true) })
    await tap.wait(500)

    const url = await tap.eval(() => location.href)
    return [{ status: "ready", url }]
  }
}

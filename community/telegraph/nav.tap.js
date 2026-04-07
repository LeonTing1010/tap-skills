export default {
  site: "telegraph",
  name: "nav",
  intent: "read",
  description: "Navigate to Telegraph editor and activate",
  columns: ["status", "url"],
  args: {},

  async tap(tap) {
    await tap.nav("https://telegra.ph")
    await tap.wait(2000)

    // Activate Quill editor
    await tap.eval(() => { quill.enable(true) })
    await tap.wait(500)

    const url = await tap.eval(() => location.href)
    return [{ status: "ready", url }]
  }
}

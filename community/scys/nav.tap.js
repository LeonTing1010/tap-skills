export default {
  site: "scys",
  name: "nav",
  intent: "write",
  description: "Navigate to SCYS homepage (requires login)",
  columns: ["url", "title"],
  health: { min_rows: 1, non_empty: ["url"] },

  async tap(tap, args) {
    await tap.nav("https://scys.com")
    await tap.wait(2000)

    const info = await tap.eval(() => ({
      url: location.href,
      title: document.title
    }))

    return [{ url: info.url, title: info.title }]
  }
}

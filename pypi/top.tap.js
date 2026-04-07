export default {
  site: "pypi",
  name: "top",
  intent: "read",
  description: "PyPI top Python packages",
  url: "https://pypi.org",
  health: { min_rows: 10, non_empty: ["project"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch("https://hugovk.github.io/top-pypi-packages/top-pypi-packages-30-days.min.json", { credentials: 'include' })
    const data = await res.json()
    return data.rows.map(item => ({
      project: item.project,
      download_count: String(item.download_count)
    }))
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

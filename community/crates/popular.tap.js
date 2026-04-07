export default {
  site: "crates",
  name: "popular",
  intent: "read",
  description: "crates.io popular Rust packages",
  url: "https://crates.io",
  health: { min_rows: 5, non_empty: ["name"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch('/api/v1/crates?page=1&per_page=50&sort=downloads')
    const data = await res.json()
    return data.crates.map(c => ({
      name: c.name,
      downloads: String(c.downloads),
      description: (c.description || '').substring(0, 60)
    }))
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

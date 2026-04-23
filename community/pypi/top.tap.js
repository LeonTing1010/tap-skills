export default {
  site: "pypi",
  name: "top",
  intent: "read",
  description: "PyPI top Python packages by downloads (last 30 days)",
  health: { min_rows: 10, non_empty: ["project"] },

  tap: async (tap) => {
    const data = await tap.fetch(
      "https://hugovk.github.io/top-pypi-packages/top-pypi-packages-30-days.min.json",
    )
    return data.rows.slice(0, 50).map(item => ({
      project: item.project,
      download_count: String(item.download_count),
    }))
  },
}

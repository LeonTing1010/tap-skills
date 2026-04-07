export default {
  site: "pypi",
  name: "top",
  intent: "read",
  description: "PyPI top Python packages",
  health: { min_rows: 10, non_empty: ["project"] },

  async tap(handle, _args) {
    const data = await handle.fetch(
      "https://hugovk.github.io/top-pypi-packages/top-pypi-packages-30-days.min.json",
    );
    return data.rows.map(item => ({
      project: item.project,
      download_count: String(item.download_count),
    }));
  },
}

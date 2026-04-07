export default {
  site: "github",
  name: "issues",
  intent: "read",
  description: "GitHub issues for a repository",
  url: "https://github.com",
  args: { repo: { type: "string" } },
  health: { min_rows: 1, non_empty: ["title"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch(
      'https://api.github.com/repos/' + args.repo + '/issues?per_page=30&state=open&sort=updated',
      { headers: { 'Accept': 'application/vnd.github.v3+json' } }
    )
    const data = await res.json()
    if (!Array.isArray(data)) {
      return [{ title: 'Error: ' + (data.message || 'invalid repo'), number: '0', author: '', labels: '', url: '' }]
    }
    return data
      .filter(item => !item.pull_request)
      .map((item, i) => ({
        rank: String(i + 1),
        number: String(item.number),
        title: item.title,
        author: item.user?.login || '',
        labels: (item.labels || []).map(l => l.name).join(', '),
        comments: String(item.comments || 0),
        updated: item.updated_at?.split('T')[0] || '',
        url: item.html_url
      }))
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

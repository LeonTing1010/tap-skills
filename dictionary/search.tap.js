export default {
  site: "dictionary",
  name: "search",
  intent: "read",
  description: "English dictionary lookup (Free Dictionary API)",
  url: "https://dictionaryapi.dev",
  args: { word: { type: "string" } },
  health: { min_rows: 1, non_empty: ["word", "definition"] },

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(args.word), { credentials: 'include' })
    if (!res.ok) return [{ word: args.word, partOfSpeech: '-', definition: 'Not found', example: '-' }]
    const data = await res.json()
    const results = []
    for (const entry of data) {
      for (const m of entry.meanings) {
        for (const d of m.definitions.slice(0, 2)) {
          results.push({
            word: String(entry.word),
            partOfSpeech: String(m.partOfSpeech),
            definition: String(d.definition),
            example: String(d.example || '-')
          })
        }
      }
    }
    return results
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}

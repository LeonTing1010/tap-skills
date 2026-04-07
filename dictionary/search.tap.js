export default {
  site: "dictionary",
  name: "search",
  intent: "read",
  description: "English dictionary lookup (Free Dictionary API)",
  args: { word: { type: "string" } },
  health: { min_rows: 1, non_empty: ["word", "definition"] },

  async tap(handle, args) {
    let data;
    try {
      data = await handle.fetch(
        "https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURIComponent(args.word),
      );
    } catch {
      return [{ word: args.word, partOfSpeech: "-", definition: "Not found", example: "-" }];
    }
    const results = [];
    for (const entry of data) {
      for (const m of entry.meanings) {
        for (const d of m.definitions.slice(0, 2)) {
          results.push({
            word: String(entry.word),
            partOfSpeech: String(m.partOfSpeech),
            definition: String(d.definition),
            example: String(d.example || "-"),
          });
        }
      }
    }
    return results;
  },
}

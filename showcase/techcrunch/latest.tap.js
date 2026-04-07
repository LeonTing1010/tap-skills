export default {
  site: "techcrunch",
  name: "latest",
  intent: "read",
  description: "TechCrunch latest articles via RSS feed — zero DOM dependency",
  url: "https://techcrunch.com",
  columns: ["title", "author", "date", "category", "link", "summary"],
  health: { min_rows: 5, non_empty: ["title", "link"] },
  examples: [{}],

  async tap(handle, args) {
    const url = typeof this.url === "function" ? this.url(args) : this.url;
    if (url) await handle.nav(url);
    if (this.waitFor) await handle.waitFor(this.waitFor);
    const fn = async (args) => {
    const res = await fetch("/feed/", { credentials: "include" })
    const text = await res.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, "text/xml")
    return Array.from(doc.querySelectorAll("item")).map(item => {
      const get = (tag) => item.querySelector(tag)?.textContent?.trim() || ""
      const desc = get("description").replace(/<[^>]+>/g, "").trim()
      const cats = Array.from(item.querySelectorAll("category")).map(c => c.textContent?.trim()).filter(Boolean)
      return {
        title: get("title"),
        author: item.getElementsByTagName("dc:creator")[0]?.textContent?.trim() || "",
        date: get("pubDate"),
        category: cats.slice(0, 3).join(", "),
        link: get("link"),
        summary: desc.substring(0, 200),
      }
    }).filter(item => item.title)
  };
    return await handle.eval(`(${fn.toString()})(${JSON.stringify(args)})`);
  }
}
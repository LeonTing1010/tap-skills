export default {
  site: "x",
  name: "notifications",
  description: "Get X/Twitter notifications (replies, likes, mentions)",
  url: "https://x.com/notifications",
  waitFor: "article",
  timeout: 15000,
  health: { min_rows: 1, non_empty: ["text"] },
  columns: ["type", "user", "handle", "text", "time"],
  extract: () => {
    const seen = new Set()
    return Array.from(document.querySelectorAll('article, [data-testid="cellInnerDiv"]')).map(el => {
      const userEl = el.querySelector('[data-testid="User-Name"]')
      const spans = userEl ? Array.from(userEl.querySelectorAll("span")) : []
      let user = "", handle = ""
      for (const s of spans) {
        const t = (s.textContent || "").trim()
        if (t.startsWith("@")) { handle = t; break }
        if (t && !t.includes("·") && !user) user = t
      }
      const textEl = el.querySelector('[data-testid="tweetText"]')
      const text = textEl ? textEl.textContent.trim().substring(0, 200) : ""
      const timeEl = el.querySelector("time")
      const time = timeEl ? timeEl.getAttribute("datetime") || timeEl.textContent || "" : ""

      // Determine notification type
      let type = "mention"
      const social = el.querySelector('[data-testid="socialContext"]')?.textContent || ""
      if (social.includes("liked")) type = "like"
      else if (social.includes("reposted") || social.includes("retweeted")) type = "repost"
      else if (social.includes("followed")) type = "follow"
      else if (text) type = "reply"

      const key = `${handle}:${text.slice(0, 30)}`
      if (!user || seen.has(key)) return null
      seen.add(key)
      return { type, user, handle, text, time }
    }).filter(Boolean)
  }
}
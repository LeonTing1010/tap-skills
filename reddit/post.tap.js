export default {
  site: "reddit",
  name: "post",
  intent: "write",
  description: "Submit a post to Reddit",
  columns: ["status", "url"],
  args: {
    title: { type: "string" },
    subreddit: { type: "string" },
    content: { type: "string", optional: true },
    link: { type: "string", optional: true }
  },

  async tap(tap, args) {
    if (!args.title || !args.subreddit) {
      return [{ status: "error", url: "missing title or subreddit" }]
    }

    const sub = args.subreddit.replace(/^r\//, "")
    const kind = args.link ? "link" : "self"

    // Navigate to old.reddit.com first (get modhash + cookie context)
    const qs = args.link ? "" : "?selftext=true"
    await tap.nav(`https://old.reddit.com/r/${sub}/submit${qs}`)

    // === Strategy 1: API from old.reddit.com page context ===
    const apiResult = await tap.eval(`
      (async () => {
        const modhash = document.querySelector('input[name="uh"]')?.value || '';
        if (!modhash) return JSON.stringify({ error: 'not logged in' });

        const res = await fetch("/api/submit", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            api_type: "json",
            kind: ${JSON.stringify(kind)},
            sr: ${JSON.stringify(sub)},
            title: ${JSON.stringify(args.title)},
            uh: modhash,
            ${args.link ? `url: ${JSON.stringify(args.link)}, resubmit: "true",` : ""}
            ${args.content ? `text: ${JSON.stringify(args.content)},` : ""}
          }).toString()
        });
        const data = await res.json();
        if (data.json?.data?.url) return JSON.stringify({ url: data.json.data.url });
        const errors = data.json?.errors;
        if (errors?.length) return JSON.stringify({ error: errors.map(e => e.join(": ")).join("; ") });
        return JSON.stringify({ error: "unknown" });
      })()
    `)

    try {
      const parsed = JSON.parse(apiResult)
      if (parsed.url) return [{ status: "posted", url: parsed.url }]
      // CAPTCHA or flair error — fall through to form
      if (parsed.error && !parsed.error.includes("CAPTCHA") && !parsed.error.includes("flair")) {
        return [{ status: "error", url: parsed.error }]
      }
    } catch (_) {}

    // === Strategy 2: old.reddit.com form (already on page) ===
    await tap.fill('[name="title"]', args.title)

    if (args.link) {
      await tap.fill('[name="url"]', args.link)
    } else if (args.content) {
      await tap.eval(() => {
        const tab = document.querySelector('.text-button')
        if (tab) tab.click()
      })
      await tap.wait(500)
      await tap.fill('[name="text"]', args.content)
    }

    await tap.click('[name="submit"]')
    await tap.wait(5000)

    const url = await tap.eval(() => location.href)
    const posted = url.includes("/comments/")

    return [{
      status: posted ? "posted" : "check-browser",
      url
    }]
  }
}

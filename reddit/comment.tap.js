export default {
  site: "reddit",
  name: "comment",
  description: "Post a comment on Reddit (requires login)",
  columns: ["status", "url"],
  args: {
    post_url: { type: "string" },
    content: { type: "string" }
  },

  async run(tap, args) {
    if (!args.post_url || !args.content) {
      return [{ status: "error", url: "missing post_url or content" }]
    }

    // Extract thing_id from URL
    const commentMatch = args.post_url.match(/\/comment\/(\w+)/)
    const postMatch = args.post_url.match(/\/comments\/(\w+)/)
    const thing_id = commentMatch ? `t1_${commentMatch[1]}` : postMatch ? `t3_${postMatch[1]}` : null
    if (!thing_id) {
      return [{ status: "error", url: "cannot extract post/comment id from URL" }]
    }

    // Navigate to old.reddit.com to get modhash + cookie context
    const oldUrl = args.post_url.replace("www.reddit.com", "old.reddit.com")
    await tap.nav(oldUrl)

    // Post via API from old.reddit.com page context (proven approach)
    const result = await tap.eval(`
      (async () => {
        const modhash = document.querySelector('input[name="uh"]')?.value || '';
        if (!modhash) return JSON.stringify({ error: 'not logged in' });

        const res = await fetch("/api/comment", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            api_type: "json",
            thing_id: ${JSON.stringify(thing_id)},
            text: ${JSON.stringify(args.content)},
            uh: modhash
          }).toString()
        });
        const data = await res.json();
        const permalink = data.json?.data?.things?.[0]?.data?.permalink;
        const errors = data.json?.errors;
        if (permalink) return JSON.stringify({ url: "https://www.reddit.com" + permalink });
        if (errors?.length) return JSON.stringify({ error: errors.map(e => e.join(": ")).join("; ") });
        return JSON.stringify({ error: "unknown" });
      })()
    `)

    const parsed = JSON.parse(result)
    if (parsed.url) {
      return [{ status: "commented", url: parsed.url }]
    }

    // Fallback: fill form directly on old.reddit.com
    try {
      await tap.fill('[name="text"]', args.content)
      await tap.click('.save[type="submit"]')
      await tap.wait(5000)
      const url = await tap.eval(() => location.href)
      return [{ status: "commented", url }]
    } catch (_) {}

    return [{ status: "error", url: parsed.error || "failed" }]
  }
}

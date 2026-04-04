export default {
  site: "indexnow",
  name: "submit",
  description: "Submit URLs to IndexNow for instant Bing/Yandex/Google indexing",
  columns: ["url", "status"],
  args: {
    host: { type: "string", required: true, description: "Your domain (e.g. taprun.dev)" },
    key: { type: "string", required: true, description: "IndexNow key" },
    urls: { type: "string", required: true, description: "Comma-separated URLs to submit" },
  },
  health: { min_rows: 1, non_empty: ["url", "status"] },
  examples: [{ host: "example.com", key: "your-indexnow-key", urls: "https://example.com/" }],

  run: async (tap, args) => {
    const urlList = args.urls.split(",").map(u => u.trim()).filter(Boolean);
    const body = {
      host: args.host,
      key: args.key,
      keyLocation: `https://${args.host}/${args.key}.txt`,
      urlList,
    };

    const resp = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return urlList.map(url => ({
      url: String(url),
      status: String(resp.status >= 200 && resp.status < 300 ? "accepted" : `error:${resp.status}`),
    }));
  },
};

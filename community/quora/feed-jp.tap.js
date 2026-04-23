export default {
  site: "quora",
  name: "feed-jp",
  intent: "read",
  description: "Quora Japan homepage feed — questions + answer snippets from the explore feed. Each question is a L3/L5 signal container by construction.",
  url: "https://jp.quora.com/",
  health: { min_rows: 3, non_empty: ["title"] },
  examples: [{}],

  async tap(handle, _args) {
    await handle.nav(this.url);
    await handle.wait(3500);
    // Aggressive scroll to load the infinite feed
    for (let y = 1000; y <= 18000; y += 1500) {
      await handle.eval("window.scrollTo(0, " + y + ")");
      await handle.wait(900);
    }
    return await handle.eval(() => {
      const items = [];
      const seen = new Set();

      // Quora question cards surface as `a.q-box.qu-display--block` whose text
      // is the full question sentence (length 15-400, contains CJK, usually
      // ends with ？ but not always — some end in ます/です).
      const anchors = document.querySelectorAll("a.q-box.qu-display--block");
      anchors.forEach((a) => {
        const title = (a.textContent || "").replace(/\s+/g, " ").trim();
        if (title.length < 15 || title.length > 400) return;
        // Must contain Japanese characters (hiragana/katakana/CJK) — reject topic tags like "数学" (too short anyway)
        if (!/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(title)) return;
        // Drop UI fragments
        if (/^(ホーム|回答|スペース|通知|質問する|フォロー|ログイン|サインアップ)/.test(title)) return;
        if (seen.has(title)) return;
        seen.add(title);

        // Body: find nearest card/row parent and grab its innerText minus the title
        let box = a.closest("div.q-box.qu-vertical-align--top, div[class*='Card'], div[class*='Feed']");
        if (!box) box = a.parentElement?.parentElement?.parentElement || a.parentElement;
        let body = "";
        if (box) {
          body = (box.innerText || "").replace(title, "").replace(/\s+/g, " ").trim().slice(0, 1500);
        }
        const url = a.href || ("https://jp.quora.com" + a.getAttribute("href"));
        items.push({ title: title, url: url, body: body });
      });
      return items.slice(0, 80);
    });
  },
};

/**
 * wechat/app-search — Search WeChat 搜一搜 on macOS, extract structured results.
 * Runtime: macos
 *
 *   tap --runtime macos wechat app-search --query "发票整理"
 */
export default {
  site: "wechat",
  name: "app-search",
  runtime: "macos",
  app: "WeChat",
  description: "Search inside WeChat macOS app (contacts, chats, articles)",
  columns: ["title", "content"],
  args: {
    query: { type: "string", required: true, description: "Search query" },
    scroll: { type: "int", default: 0, description: "Scroll N extra screens (0-3)" },
  },

  async run(page, args) {
    const query = args.query;
    const scrollCount = Math.min(Math.max(args.scroll || 0, 0), 3);

    // --- Helpers ---
    async function scrollPixels(x, y, px) {
      await page.eval(`
        ObjC.import('CoreGraphics');
        var e = $.CGEventCreateScrollWheelEvent(null, 1, 1, ${-px});
        $.CGEventSetLocation(e, $.CGPointMake(${x}, ${y}));
        $.CGEventPost($.kCGHIDEventTap, e);
      `);
    }

    function parseResults(text) {
      const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
      const results = [];

      // Related Results
      const relatedIdx = lines.indexOf("Related Results");
      const related = [];
      if (relatedIdx >= 0) {
        for (let i = relatedIdx + 1; i < lines.length; i++) {
          const l = lines[i];
          if (l.includes("Account") || l.includes("More") || /\d+:\d+/.test(l) || /day\(s\)|month|hrs|Yesterday/.test(l)) break;
          if (l.length > 2 && l.length < 50) related.push(l);
        }
      }

      // 大家都在搜
      const hotIdx = lines.findIndex(l => l.includes("大家都在搜"));
      const hot = [];
      if (hotIdx >= 0) {
        for (let i = hotIdx + 1; i < lines.length; i++) {
          const l = lines[i];
          if (/day\(s\)|month|hrs|Yesterday/.test(l) || l.length > 40) break;
          if (l.length > 2) hot.push(l);
        }
      }

      // Mini-programs (name followed by literal "小程序" on next line)
      const mps = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i] === "小程序" && i > 0 && !related.includes(lines[i - 1])) {
          mps.push(lines[i - 1]);
        }
      }

      // Articles/Videos (lines ending with time markers)
      const timeRe = /^(\d+ (?:day|month|hr|min|sec)\(s\) ago|Yesterday|Today|\d+ \w+ ago)$/;
      const durRe = /^\d{2}:\d{2}$/;
      const articles = [];
      const seen = new Set();
      for (let i = 0; i < lines.length; i++) {
        if (timeRe.test(lines[i])) {
          const time = lines[i];
          const source = (i >= 1 && !timeRe.test(lines[i-1]) && lines[i-1].length < 30) ? lines[i-1] : "";
          let descEnd = source ? i - 2 : i - 1;
          let title = "";
          for (let j = descEnd; j >= Math.max(0, descEnd - 4); j--) {
            if (durRe.test(lines[j]) || /^\d+$/.test(lines[j]) || timeRe.test(lines[j])) continue;
            if (lines[j].length > 10) { title = lines[j]; break; }
          }
          const key = title.slice(0, 30);
          if (title && !seen.has(key)) {
            seen.add(key);
            articles.push(`${title} | ${source} | ${time}`);
          }
        }
      }

      if (related.length) results.push({ title: "关联搜索词", content: related.join("\n") });
      if (mps.length) results.push({ title: "已有小程序", content: [...new Set(mps)].join("\n") });
      if (hot.length) results.push({ title: "大家都在搜", content: hot.join("\n") });
      if (articles.length) results.push({ title: `搜索结果 (${articles.length}条)`, content: articles.join("\n") });
      return results;
    }

    // --- 1. Activate + get window in ONE eval (WeChat hides AX windows when not frontmost) ---
    const win = await page.eval(`
      Application("WeChat").activate();
      delay(0.5);
      var se = Application("System Events");
      se.keyCode(53); delay(0.2); se.keyCode(53); delay(0.3);
      var proc = se.processes["WeChat"];
      var wins = proc.windows();
      var r = [];
      for (var i = 0; i < wins.length; i++) {
        var p = wins[i].position(), s = wins[i].size();
        r.push({ title: String(wins[i].name()), x: p[0], y: p[1], w: s[0], h: s[1] });
      }
      var main = null;
      for (var i = 0; i < r.length; i++) {
        if (r[i].title === "Weixin" || r[i].title === "微信") { main = r[i]; break; }
      }
      if (!main && r.length > 0) main = r[0];
      JSON.stringify(main);
    `);
    if (!win) throw new Error("WeChat main window not found");

    // --- 3. Click search bar ---
    await page.pointer(Math.round(win.x + 105), Math.round(win.y + 28), "click");
    await page.wait(800);

    // --- 4. Paste query (clipboard for CJK) ---
    await page.keyboard(query, "type");
    await page.wait(1500);

    // --- 5. Enter → 搜一搜 ---
    await page.keyboard("Enter", "press");
    await page.wait(5000);

    // --- 6. Extract text via page.copyAll() ---
    const rawText = (await page.copyAll()) || "";
    const text = typeof rawText === "string" ? rawText : String(rawText);
    const results = parseResults(text);

    // --- 7. Scroll + extract more (optional) ---
    if (scrollCount > 0 && win) {
      const contentH = win.h - 80;
      const scrollPx = Math.round(contentH * 0.85);
      const sx = Math.round(win.x + win.w * 0.6);
      const sy = Math.round(win.y + 80 + contentH * 0.5);

      for (let i = 0; i < scrollCount; i++) {
        await scrollPixels(sx, sy, scrollPx);
        await page.wait(2000);
        const moreText = (await page.copyAll()) || "";
        const more = String(moreText);
        if (more.length > 100) {
          results.push({ title: `screen ${i + 2}`, content: more.slice(0, 4000) });
        }
      }
    }

    // Fallback if nothing parsed
    if (results.length === 0 && text.length > 0) {
      results.push({ title: `${query} — 原始数据`, content: text.slice(0, 4000) });
    }

    return results;
  },

  async cleanup(page) {
    // Escape out of search results back to chat list.
    // Do NOT use Cmd+W — search is a tab in the main window, Cmd+W closes everything.
    await page.eval(`
      Application("WeChat").activate();
      delay(0.2);
      var se = Application("System Events");
      se.keyCode(53); delay(0.3);
      se.keyCode(53); delay(0.3);
      se.keyCode(53);
    `);
  },
};

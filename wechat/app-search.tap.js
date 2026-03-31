/**
 * wechat/app-search — Search WeChat 搜一搜 on macOS and capture results.
 * Runtime: macos
 *
 * Opens WeChat sidebar search, pastes query (clipboard for Chinese support),
 * presses Enter to trigger 搜一搜, then captures a screenshot of results.
 *
 *   tap --runtime macos wechat app-search --query "发票整理"
 *   tap --runtime macos wechat app-search --query "拼豆图纸" --scroll 2
 */
export default {
  site: "wechat",
  name: "app-search",
  description: "Search inside WeChat macOS app (contacts, chats, articles)",
  columns: ["title", "content"],
  args: {
    query: { type: "string", required: true, description: "Search query (pinyin or Chinese)" },
    scroll: { type: "int", default: 0, description: "Scroll down N screens after first capture (0-3)" },
  },

  async run(page, args) {
    const query = args.query;
    const scrollCount = Math.min(Math.max(args.scroll || 0, 0), 3);

    // --- Helpers ---

    async function getMainWindow() {
      const wins = await page.eval(`
        var se = Application("System Events");
        var proc = se.processes["WeChat"];
        var wins = proc.windows();
        var r = [];
        for (var i = 0; i < wins.length; i++) {
          var p = wins[i].position(), s = wins[i].size();
          r.push({ title: String(wins[i].name()), desc: String(wins[i].description()), x: p[0], y: p[1], w: s[0], h: s[1] });
        }
        JSON.stringify(r);
      `);
      if (!Array.isArray(wins)) return null;
      return wins.find(w => w.title === "Weixin" || w.title === "微信") || wins[0] || null;
    }

    async function setClipboard(text) {
      await page.eval(`
        var app = Application.currentApplication();
        app.includeStandardAdditions = true;
        app.setTheClipboardTo(${JSON.stringify(text)});
      `);
    }

    async function scrollPixels(x, y, px) {
      await page.eval(`
        ObjC.import('CoreGraphics');
        var e = $.CGEventCreateScrollWheelEvent(null, 1, 1, ${-px});
        $.CGEventSetLocation(e, $.CGPointMake(${x}, ${y}));
        $.CGEventPost($.kCGHIDEventTap, e);
      `);
    }

    // --- 1. Activate WeChat ---
    await page.eval(`Application("WeChat").activate();`);
    await page.wait(500);

    // Clean state: Escape any open panels
    await page.keyboard("Escape", "press");
    await page.wait(300);
    await page.keyboard("Escape", "press");
    await page.wait(300);

    // --- 2. Get window geometry ---
    const win = await getMainWindow();
    if (!win) throw new Error("WeChat main window not found");

    // --- 3. Click sidebar search bar ---
    // WeChat Mac: search box at top of left panel, offset ~(105, 28) from window origin
    await page.pointer(Math.round(win.x + 105), Math.round(win.y + 28), "click");
    await page.wait(800);

    // --- 4. Paste query via clipboard (Chinese support) ---
    await setClipboard(query);
    await page.keyboard("Meta+V", "press");
    await page.wait(1500);

    // --- 5. Press Enter → 搜一搜 ---
    await page.keyboard("Enter", "press");
    await page.wait(4000); // Wait for 搜一搜 results page to load

    // --- 6. Extract text via Edit menu (Select All → Copy) ---
    // Edit menu is application-level, works reliably on WebViews unlike CGEvent keyboard.
    const rawText = await page.eval(`
      var app = Application.currentApplication();
      app.includeStandardAdditions = true;
      var se = Application("System Events");
      var proc = se.processes["WeChat"];

      Application("WeChat").activate();
      delay(0.5);

      app.setTheClipboardTo("");
      delay(0.1);

      proc.menuBars[0].menuBarItems["Edit"].menus[0].menuItems["Select All"].click();
      delay(0.5);
      proc.menuBars[0].menuBarItems["Edit"].menus[0].menuItems["Copy"].click();
      delay(0.5);

      String(app.theClipboard());
    `) || "";

    // --- 7. Parse structured content ---
    const text = typeof rawText === "string" ? rawText : String(rawText);
    const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);

    // Parse: Related Results (right sidebar)
    const relatedIdx = lines.indexOf("Related Results");
    const related = [];
    if (relatedIdx >= 0) {
      for (let i = relatedIdx + 1; i < lines.length; i++) {
        const l = lines[i];
        // Stop at first article/account marker
        if (l.includes("Account") || l.includes("More") || /\d+:\d+/.test(l) || /day\(s\)|month|hrs|Yesterday/.test(l)) break;
        if (l.length > 2 && l.length < 50) related.push(l);
      }
    }

    // Parse: 大家都在搜 (popular searches)
    const hotIdx = lines.findIndex(l => l.includes("大家都在搜"));
    const hotSearches = [];
    if (hotIdx >= 0) {
      for (let i = hotIdx + 1; i < lines.length; i++) {
        const l = lines[i];
        if (/day\(s\)|month|hrs|Yesterday/.test(l) || l.length > 40) break;
        if (l.length > 2) hotSearches.push(l);
      }
    }

    // Parse: Mini-programs (actual apps, not search suggestions)
    // Pattern: a name followed by "小程序" on the next line = real mini-program
    // vs "XX小程序" in Related Results = just a search term
    const miniPrograms = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === "小程序" && i > 0 && !related.includes(lines[i - 1])) {
        miniPrograms.push(lines[i - 1]);
      }
    }

    // Parse: Articles & Videos (content with time markers)
    const timePattern = /^(\d+ (?:day|month|hr|min|sec)\(s\) ago|Yesterday|Today|\d+ \w+ ago)$/;
    const durationPattern = /^\d{2}:\d{2}$/;
    const articles = [];
    for (let i = 0; i < lines.length; i++) {
      if (timePattern.test(lines[i])) {
        // Walk backwards to find title, source, description
        const time = lines[i];
        const source = (i >= 1 && !timePattern.test(lines[i-1]) && lines[i-1].length < 30) ? lines[i-1] : "";
        // Find the content block: scan back past source to find description + title
        let descEnd = source ? i - 2 : i - 1;
        let title = "";
        let desc = "";
        // The title is usually the first long line before this time marker
        for (let j = descEnd; j >= Math.max(0, descEnd - 4); j--) {
          const l = lines[j];
          if (durationPattern.test(l) || /^\d+$/.test(l) || timePattern.test(l)) continue;
          if (!title && l.length > 10) {
            title = l;
          } else if (title && l.length > 10 && !desc) {
            desc = l;
          }
        }
        if (title) {
          articles.push({ title, source, time, desc: desc || "" });
        }
      }
    }

    // Build structured results
    const results = [];

    if (related.length > 0) {
      results.push({
        title: `关联搜索词`,
        content: related.join("\n"),
      });
    }

    if (miniPrograms.length > 0) {
      results.push({
        title: `已有小程序`,
        content: [...new Set(miniPrograms)].join("\n"),
      });
    }

    if (hotSearches.length > 0) {
      results.push({
        title: `大家都在搜`,
        content: hotSearches.join("\n"),
      });
    }

    if (articles.length > 0) {
      // Dedupe by title
      const seen = new Set();
      const unique = articles.filter(a => {
        const key = a.title.slice(0, 30);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const articleText = unique.map(a =>
        `${a.title} | ${a.source} | ${a.time}${a.desc ? "\n  " + a.desc : ""}`
      ).join("\n");
      results.push({
        title: `搜索结果 (${unique.length}条)`,
        content: articleText,
      });
    }

    // Fallback: if no structured data parsed, return raw text
    if (results.length === 0) {
      results.push({ title: `${query} — 原始数据`, content: text.slice(0, 4000) });
    }

    // --- 8. Scroll + capture additional screens (optional) ---
    if (scrollCount > 0) {
      const headerH = 80;
      const contentH = win.h - headerH;
      const scrollPx = Math.round(contentH * 0.85);
      const scrollX = Math.round(win.x + win.w * 0.6);
      const scrollY = Math.round(win.y + headerH + contentH * 0.5);

      for (let i = 0; i < scrollCount; i++) {
        await scrollPixels(scrollX, scrollY, scrollPx);
        await page.wait(2000);

        // Extract text after scroll via Edit menu
        const scrollText = await page.eval(`
          var app = Application.currentApplication();
          app.includeStandardAdditions = true;
          var se = Application("System Events");
          var proc = se.processes["WeChat"];
          Application("WeChat").activate();
          delay(0.3);
          app.setTheClipboardTo("");
          delay(0.1);
          proc.menuBars[0].menuBarItems["Edit"].menus[0].menuItems["Select All"].click();
          delay(0.5);
          proc.menuBars[0].menuBarItems["Edit"].menus[0].menuItems["Copy"].click();
          delay(0.5);
          String(app.theClipboard());
        `) || "";
        results.push({
          title: `${query} — screen ${i + 2}`,
          content: String(scrollText).slice(0, 4000),
        });
      }
    }

    // --- 9. Close search tab only, return to clean chat view ---
    await page.eval(`
      var se = Application("System Events");
      var proc = se.processes["WeChat"];
      Application("WeChat").activate();
      delay(0.2);
      // Only close if current window looks like a search tab ("XX - Search")
      var wins = proc.windows();
      var closed = false;
      for (var i = 0; i < wins.length; i++) {
        var title = String(wins[i].name());
        if (title.includes("Search") || title.includes("搜索")) {
          se.keystroke("w", {using: "command down"});
          closed = true;
          break;
        }
      }
      delay(0.3);
      // Escape any remaining search panel
      se.keyCode(53); delay(0.2);
      se.keyCode(53);
    `);
    await page.wait(300);

    return results;
  },
};

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
  },

  async run(tap, args) {
    const query = args.query;

    // Single eval: activate → search → wait → extract → cleanup. Zero focus switching.
    const rawText = await tap.eval(`
      ObjC.import('CoreGraphics');
      var app = Application.currentApplication();
      app.includeStandardAdditions = true;
      var se = Application("System Events");

      // 1. Activate + get window
      Application("WeChat").activate();
      delay(0.5);
      se.keyCode(53); delay(0.2); se.keyCode(53); delay(0.3);
      var proc = se.processes["WeChat"];
      var wins = proc.windows();
      if (wins.length === 0) throw new Error("WeChat main window not found");
      var win = wins[0];
      var pos = win.position();

      // 2. Click search bar
      var pt = $.CGPointMake(pos[0] + 105, pos[1] + 28);
      var md = $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseDown, pt, 0);
      $.CGEventPost($.kCGHIDEventTap, md);
      delay(0.05);
      var mu = $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseUp, pt, 0);
      $.CGEventPost($.kCGHIDEventTap, mu);
      delay(0.8);

      // 3. Paste query via clipboard
      app.setTheClipboardTo(${JSON.stringify(query)});
      delay(0.1);
      var vd = $.CGEventCreateKeyboardEvent(null, 9, true);
      $.CGEventSetFlags(vd, $.kCGEventFlagMaskCommand);
      $.CGEventPost($.kCGHIDEventTap, vd);
      delay(0.03);
      var vu = $.CGEventCreateKeyboardEvent(null, 9, false);
      $.CGEventSetFlags(vu, $.kCGEventFlagMaskCommand);
      $.CGEventPost($.kCGHIDEventTap, vu);
      delay(1.5);

      // 4. Enter → 搜一搜
      var ed = $.CGEventCreateKeyboardEvent(null, 36, true);
      $.CGEventPost($.kCGHIDEventTap, ed);
      delay(0.03);
      var eu = $.CGEventCreateKeyboardEvent(null, 36, false);
      $.CGEventPost($.kCGHIDEventTap, eu);

      // 5. Wait for search results page
      for (var i = 0; i < 10; i++) {
        delay(1);
        Application("WeChat").activate();
        var ws = proc.windows();
        var found = false;
        for (var j = 0; j < ws.length; j++) {
          if (String(ws[j].name()).indexOf("Search") >= 0) { found = true; break; }
        }
        if (found) break;
      }

      // 6. Select All + Copy
      app.setTheClipboardTo("");
      delay(0.1);
      proc.menuBars[0].menuBarItems["Edit"].menus[0].menuItems["Select All"].click();
      delay(0.5);
      proc.menuBars[0].menuBarItems["Edit"].menus[0].menuItems["Copy"].click();
      delay(0.5);
      var result = String(app.theClipboard());

      // 7. Cleanup: Escape back to chat
      se.keyCode(53); delay(0.2); se.keyCode(53); delay(0.2); se.keyCode(53);

      result;
    `);

    // Parse structured results
    const text = typeof rawText === "string" ? rawText : String(rawText || "");
    if (!text) return [{ title: query, content: "no results" }];

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

    // Mini-programs
    const mps = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === "小程序" && i > 0 && !related.includes(lines[i - 1])) {
        mps.push(lines[i - 1]);
      }
    }

    // Articles/Videos
    const timeRe = /^(\d+ (?:day|month|hr|min|sec)\(s\) ago|Yesterday|Today|\d+ \w+ ago)$/;
    const durRe = /^\d{2}:\d{2}$/;
    const seen = new Set();
    const articles = [];
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
    if (results.length === 0) results.push({ title: query, content: text.slice(0, 4000) });

    return results;
  },
};

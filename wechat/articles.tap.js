/**
 * wechat/articles — Read Official Account articles from WeChat.
 * Runtime: macos
 *
 * Opens WeChat Official Accounts page, clicks articles one by one,
 * extracts content via clipboard, returns structured data.
 *
 *   tap --runtime macos wechat articles
 *   tap --runtime macos wechat articles --count 3
 */
export default {
  site: "wechat",
  name: "articles",
  intent: "read",
  description: "Read WeChat Official Account articles",
  columns: ["title", "source", "content"],
  args: {
    count: { type: "string", default: "3", description: "Number of articles to read" },
  },

  async tap(tap, args) {
    const maxArticles = parseInt(args.count) || 3;

    // Helper: get window state
    async function getWindows() {
      return await tap.eval(`
        var se = Application("System Events");
        var proc = se.processes["WeChat"];
        var wins = proc.windows();
        var r = [];
        for (var i = 0; i < wins.length; i++) {
          var p = wins[i].position(), s = wins[i].size();
          r.push({ title: String(wins[i].name()), x: p[0], y: p[1], w: s[0], h: s[1] });
        }
        JSON.stringify(r);
      `);
    }

    // Helper: read clipboard
    async function readClipboard() {
      return await tap.eval(`
        var app = Application.currentApplication();
        app.includeStandardAdditions = true;
        String(app.theClipboard());
      `);
    }

    // Helper: click menu
    async function clickMenu(menu, item) {
      await tap.eval(`
        var se = Application("System Events");
        var proc = se.processes["WeChat"];
        proc.frontmost = true;
        proc.menuBars[0].menuBarItems[${JSON.stringify(menu)}].menus[0].menuItems[${JSON.stringify(item)}].click();
      `);
    }

    // Step 1: Navigate to Official Accounts (Chats view)
    await tap.eval(`Application("WeChat").activate();`);
    await tap.wait(500);
    await clickMenu("Window", "Chats");
    await tap.wait(800);

    // Get main window position
    const wins = await getWindows();
    const mainWin = wins?.find(w => w.title === "Weixin") || wins?.[0];
    if (!mainWin) throw new Error("WeChat window not found");

    const articles = [];
    // Right panel article positions: x at 55% of window, y starts at 28% stepping by 6%
    const artX = Math.round(mainWin.x + mainWin.w * 0.55);

    for (let i = 0; i < maxArticles; i++) {
      const artY = Math.round(mainWin.y + mainWin.h * (0.28 + i * 0.058));
      const beforeWins = await getWindows();

      // Click article
      await tap.pointer(artX, artY, "click");
      await tap.wait(2000);

      // Check if new window opened (AX feedback)
      const afterWins = await getWindows();
      if (!afterWins || afterWins.length <= beforeWins.length) {
        // No new window — might have missed, skip
        continue;
      }

      // Extract content via Edit menu
      const artWin = afterWins.find(w => w.title !== "Weixin");
      if (artWin) {
        // Click in the article content area
        await tap.pointer(
          Math.round(artWin.x + artWin.w * 0.4),
          Math.round(artWin.y + artWin.h * 0.5),
          "click",
        );
        await tap.wait(200);

        // Select All + Copy via menu
        try { await clickMenu("Edit", "Select All"); } catch {}
        await tap.wait(200);
        try { await clickMenu("Edit", "Copy"); } catch {}
        await tap.wait(300);

        // Read clipboard
        const content = await readClipboard();
        if (content && typeof content === "string" && content.length > 50) {
          // Parse: first line is often the title, extract source from content
          const lines = content.split(/[\r\n]+/).filter(l => l.trim());
          const title = lines[0]?.trim() || "Untitled";
          // Source is usually in the first few lines
          const source = lines.slice(0, 5).find(l =>
            /^[\u4e00-\u9fff]+$/.test(l.trim()) && l.trim().length < 20
          ) || "";

          articles.push({
            title,
            source,
            content: content.trim(),
          });
        }

        // Close article window: Cmd+W
        await tap.keyboard("Meta+W", "press");
        await tap.wait(500);
      }
    }

    return articles;
  },
};

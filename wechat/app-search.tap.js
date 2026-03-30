/**
 * wechat/app-search — Search inside WeChat macOS app via sidebar icon.
 * Runtime: macos
 *
 * Clicks the sidebar search icon, types query, selects result,
 * extracts content via clipboard. Pure keyboard + AX feedback, zero screenshots.
 *
 *   tap --runtime macos wechat app-search --query "机器之心"
 *   tap --runtime macos wechat app-search --query "jiqizhixin"
 */
export default {
  site: "wechat",
  name: "app-search",
  description: "Search inside WeChat macOS app (contacts, chats, articles)",
  columns: ["title", "content"],
  args: {
    query: { type: "string", required: true, description: "Search query (pinyin or Chinese)" },
  },

  async run(page, args) {
    const query = args.query;

    async function getWindows() {
      return await page.eval(`
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
    }

    async function readClipboard() {
      return await page.eval(`
        var app = Application.currentApplication();
        app.includeStandardAdditions = true;
        String(app.theClipboard());
      `);
    }

    async function clickMenu(menu, item) {
      await page.eval(`
        var se = Application("System Events");
        var proc = se.processes["WeChat"];
        proc.frontmost = true;
        proc.menuBars[0].menuBarItems[${JSON.stringify(menu)}].menus[0].menuItems[${JSON.stringify(item)}].click();
      `);
    }

    // 1. Activate WeChat, ensure main window is open
    await page.eval(`Application("WeChat").activate();`);
    await page.wait(300);
    await clickMenu("Window", "Chats");
    await page.wait(500);

    // 2. Get main window from AX — recover via Dock click if needed
    let wins = await getWindows();
    if (!wins?.find(w => w.title === "Weixin")) {
      await page.eval(`
        var se = Application("System Events");
        se.processes["Dock"].lists[0].uiElements["WeChat"].click();
      `);
      await page.wait(1000);
      wins = await getWindows();
    }
    const mainWin = wins?.find(w => w.title === "Weixin");
    if (!mainWin) throw new Error("WeChat main window not found");

    // 3. Click sidebar search icon (position validated: x+28, y+65)
    await page.pointer(
      Math.round(mainWin.x + 28),
      Math.round(mainWin.y + 65),
      "click",
    );
    await page.wait(500);

    // 4. AX feedback: verify search dialog appeared
    const afterClick = await getWindows();
    if (!afterClick?.some(w => w.desc === "dialog")) {
      throw new Error("Search panel did not open");
    }

    // 5. Type query
    await page.keyboard(query, "type");
    await page.wait(2000);

    // 6. ArrowDown + Enter to select first result
    await page.keyboard("ArrowDown", "press");
    await page.wait(200);
    await page.keyboard("Enter", "press");
    await page.wait(2000);

    // 7. AX feedback: check for new window (article/chat opened)
    const resultWins = await getWindows();
    const newWin = resultWins?.find(w =>
      w.desc === "standard window" &&
      !wins.find(b => b.title === w.title && b.desc === w.desc && Math.abs(b.x - w.x) < 5)
    );

    const results = [];

    if (newWin) {
      // Clear clipboard first so we can detect real content
      await page.eval(`
        var app = Application.currentApplication();
        app.includeStandardAdditions = true;
        app.setTheClipboardTo("");
      `);
      await page.wait(100);

      // Click in content area of result window
      await page.pointer(
        Math.round(newWin.x + newWin.w * 0.4),
        Math.round(newWin.y + newWin.h * 0.5),
        "click",
      );
      await page.wait(200);

      // Extract content via Edit menu
      try { await clickMenu("Edit", "Select All"); } catch {}
      await page.wait(200);
      try { await clickMenu("Edit", "Copy"); } catch {}
      await page.wait(500);

      const content = await readClipboard();
      if (content && content.length > 10) {
        const lines = content.split(/[\r\n]+/).filter(l => l.trim());
        results.push({
          title: lines[0]?.trim() || query,
          content: content.trim(),
        });
      }

      // Close result window
      await page.keyboard("Meta+W", "press");
      await page.wait(300);
    }

    // Close search panel
    await page.keyboard("Escape", "press");
    await page.wait(200);
    await page.keyboard("Escape", "press");

    return results;
  },
};

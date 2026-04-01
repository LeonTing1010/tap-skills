/**
 * macos/scroll-capture — Pixel-precise scrolling screenshot of frontmost app.
 * Runtime: macos
 *
 * Captures the current screen, then scrolls down by exactly one viewport
 * and captures again. Returns up to `screens` screenshots.
 *
 *   tap --runtime macos macos scroll-capture --screens 3
 *   tap --runtime macos macos scroll-capture --app WeChat --header 80
 */
export default {
  site: "macos",
  name: "scroll-capture",
  runtime: "macos",
  description: "Scrolling screenshots of frontmost macOS app (pixel-precise, max 3 screens)",
  columns: ["screen", "file"],
  args: {
    screens: { type: "int", default: 1, description: "Number of screens to capture (1-3)" },
    header: { type: "int", default: 0, description: "Fixed header px to skip when scrolling" },
    app: { type: "string", default: "", description: "App to activate (empty = frontmost)" },
  },

  async run(tap, args) {
    const maxScreens = Math.min(Math.max(args.screens || 1, 1), 3);
    const header = args.header || 0;

    // Activate app if specified
    if (args.app) {
      await tap.eval(`Application(${JSON.stringify(args.app)}).activate();`);
      await tap.wait(500);
    }

    // Get frontmost window geometry
    const win = await tap.eval(`
      var se = Application("System Events");
      var front = se.applicationProcesses.whose({frontmost: true})[0];
      var w = front.windows[0];
      var p = w.position(), s = w.size();
      JSON.stringify({ app: String(front.name()), title: String(w.name()), x: p[0], y: p[1], w: s[0], h: s[1] });
    `);
    if (!win) throw new Error("No frontmost window");

    // Scroll geometry: one viewport minus header, 85% to avoid missing content
    const contentH = win.h - header;
    const scrollPx = Math.round(contentH * 0.85);
    const scrollX = Math.round(win.x + win.w * 0.5);
    const scrollY = Math.round(win.y + header + contentH * 0.5);

    const results = [];
    for (let i = 0; i < maxScreens; i++) {
      if (i > 0) {
        // Pixel-precise scroll: unit=1 (kCGScrollEventUnitPixel)
        await tap.eval(`
          ObjC.import('CoreGraphics');
          var e = $.CGEventCreateScrollWheelEvent(null, 1, 1, ${-scrollPx});
          $.CGEventSetLocation(e, $.CGPointMake(${scrollX}, ${scrollY}));
          $.CGEventPost($.kCGHIDEventTap, e);
        `);
        await tap.wait(1500);
      }

      const shot = await tap.screenshot();
      const file = `/tmp/scroll-capture-${i + 1}.png`;
      results.push({ screen: String(i + 1), file });
    }

    return results;
  },
};

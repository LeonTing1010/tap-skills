/**
 * shortcuts/list — List all available Apple Shortcuts.
 * Runtime: macos
 *
 *   tap --runtime macos shortcuts list
 */
export default {
  site: "shortcuts",
  name: "list",
  description: "List available Apple Shortcuts",
  columns: ["name"],

  async run(page) {
    const result = await page.eval(`
      var app = Application.currentApplication();
      app.includeStandardAdditions = true;
      var out = app.doShellScript("shortcuts list");
      var names = out.split(/[\\r\\n]+/).filter(function(n) { return n.trim().length > 0; });
      JSON.stringify(names.map(function(n) { return { name: n.trim() }; }));
    `);

    return result || [];
  },
};

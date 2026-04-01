/**
 * shortcuts/run — Run an Apple Shortcut and return its output.
 * Runtime: macos
 *
 * Shortcuts is the API-level automation on Apple platforms.
 * Use it when available — most deterministic, app-sanctioned.
 *
 *   tap --runtime macos shortcuts run --name "My Shortcut"
 *   tap --runtime macos shortcuts run --name "翻译" --input "hello world"
 */
export default {
  site: "shortcuts",
  name: "run",
  description: "Run an Apple Shortcut",
  columns: ["output"],
  args: {
    name:  { type: "string", required: true, description: "Shortcut name" },
    input: { type: "string", default: "", description: "Input text (optional)" },
  },

  async run(tap, args) {
    // Use tap.eval to call shortcuts CLI via JXA doShellScript.
    // Shell args are single-quoted with internal quotes escaped to prevent injection.
    const esc = (s) => "'" + String(s).replace(/'/g, "'\\''") + "'";
    const name = esc(args.name);
    const input = args.input ? esc(args.input) : "";

    const cmd = input
      ? `shortcuts run ${name} --input-type text --input ${input}`
      : `shortcuts run ${name}`;

    const result = await tap.eval(`
      var app = Application.currentApplication();
      app.includeStandardAdditions = true;
      try {
        var out = app.doShellScript(${JSON.stringify(cmd)});
        JSON.stringify({ output: String(out) });
      } catch(e) {
        JSON.stringify({ error: String(e) });
      }
    `);

    if (result?.error) throw new Error(`Shortcut "${args.name}": ${result.error}`);
    return [{ output: result?.output || "" }];
  },
};

export default {
  site: "glama",
  name: "update-config",
  description: "Update Glama Dockerfile config — build steps, CMD, env schema. Uses CodeMirror execCommand.",
  args: {
    owner: { type: "string", description: "GitHub owner (default: LeonTing1010)" },
    repo: { type: "string", description: "GitHub repo name (default: tap)" },
    buildSteps: { type: "string", description: "JSON array of build step commands" },
    cmd: { type: "string", description: "JSON array of CMD arguments" },
    envSchema: { type: "string", description: "JSON schema for environment variables" },
  },
  run: async (tap, args) => {
    const owner = args.owner || "LeonTing1010";
    const repo = args.repo || "tap";

    await tap.nav(`https://glama.ai/mcp/servers/${owner}/${repo}/admin/dockerfile`);
    await tap.wait(3000);

    // Read current values from CodeMirror editors
    const before = await tap.eval(`
      const editors = document.querySelectorAll('.cm-content[role="textbox"]');
      JSON.stringify({
        buildSteps: editors[0]?.textContent?.trim() || '',
        cmd: editors[1]?.textContent?.trim() || '',
        envSchema: editors[2]?.textContent?.trim() || '',
        editorCount: editors.length
      });
    `);
    const current = JSON.parse(before);

    if (current.editorCount < 3) {
      return { error: "Expected 3+ CodeMirror editors, found " + current.editorCount, before: current };
    }

    // Helper: replace CodeMirror content via selectAll + execCommand insertText
    const setCM = async (index, value) => {
      if (!value) return false;
      const result = await tap.eval(`((idx, val) => {
        const editors = document.querySelectorAll('.cm-content[role="textbox"]');
        const ed = editors[idx];
        if (!ed) return 'no-editor';
        ed.focus();
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(ed);
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('insertText', false, val);
        return ed.textContent.trim().substring(0, 80);
      })(${index}, ${JSON.stringify(value)})`);
      return result;
    };

    const results = {};

    if (args.buildSteps) {
      results.buildSteps = await setCM(0, args.buildSteps);
      await tap.wait(300);
    }
    if (args.cmd) {
      results.cmd = await setCM(1, args.cmd);
      await tap.wait(300);
    }
    if (args.envSchema) {
      results.envSchema = await setCM(2, args.envSchema);
      await tap.wait(300);
    }

    return { before: current, updated: results };
  }
};

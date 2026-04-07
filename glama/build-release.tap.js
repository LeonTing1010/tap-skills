export default {
  site: "glama",
  name: "build-release",
  intent: "write",
  description: "Trigger a Glama Dockerfile build & release for an MCP server",
  columns: ["config", "result"],
  args: {
    owner: { type: "string", description: "GitHub owner" },
    repo: { type: "string", description: "GitHub repo name" }
  },
  tap: async (tap, args) => {
    const owner = args.owner || "LeonTing1010";
    const repo = args.repo || "tap";
    
    await tap.nav(`https://glama.ai/mcp/servers/${owner}/${repo}/admin/dockerfile`);
    await tap.wait(3000);
    
    // Check current config
    const config = await tap.eval(`
      JSON.stringify({
        buildSteps: document.querySelector('select[name="buildSteps"]')?.value?.substring(0, 80),
        cmdArgs: document.querySelector('select[name="cmdArguments"]')?.value?.substring(0, 80),
        pinnedSha: document.querySelector('input[name="pinnedCommitSha"]')?.placeholder
      });
    `);
    
    // Click Build & Release
    await tap.click("Build & Release");
    await tap.wait(15000);
    
    // Check result — page should navigate to test detail
    const result = await tap.eval(`
      const url = window.location.href;
      const text = document.body.innerText;
      const statusMatch = text.match(/Status\\s+(\\w+)/);
      JSON.stringify({ url, status: statusMatch?.[1] || 'navigated' });
    `);
    
    const parsed = JSON.parse(result);
    
    // If still testing, wait more
    if (parsed.status === 'testing') {
      await tap.wait(60000);
      const final = await tap.eval(`
        const text = document.body.innerText;
        const statusMatch = text.match(/Status\\s+(\\w+)/);
        statusMatch?.[1] || 'unknown';
      `);
      parsed.status = final;
    }
    
    return { config: JSON.parse(config), result: parsed };
  }
};
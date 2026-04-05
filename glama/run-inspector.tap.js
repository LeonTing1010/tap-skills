export default {
  site: "glama",
  name: "run-inspector",
  description: "Open Glama MCP Inspector and execute tools to generate usage data",
  args: {
    owner: { type: "string", description: "GitHub owner" },
    repo: { type: "string", description: "GitHub repo name" },
    tools: { type: "string", description: "Comma-separated tool names to execute (default: tap_list,tap_version,tap_logs)" }
  },
  run: async (tap, args) => {
    const owner = args.owner || "LeonTing1010";
    const repo = args.repo || "tap";
    const toolNames = (args.tools || "tap_list,tap_version,tap_logs").split(",").map(t => t.trim());
    
    // Navigate to server page and click Try in Browser
    await tap.nav(`https://glama.ai/mcp/servers/${owner}/${repo}`);
    await tap.wait(3000);
    await tap.click("Try in Browser");
    await tap.wait(2000);
    await tap.click("Start Inspector");
    await tap.wait(8000);
    
    // Verify we're on inspector
    const onInspector = await tap.eval(`window.location.href.includes('inspector')`);
    if (!onInspector) return { error: "Failed to open inspector" };
    
    // Execute each tool
    const results = [];
    for (const toolName of toolNames) {
      // Click the tool button
      const clicked = await tap.eval(`
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().startsWith('${toolName}'));
        if (btn) { btn.click(); 'ok' } else { 'not found' }
      `);
      
      if (clicked === 'not found') {
        results.push({ tool: toolName, status: 'not found' });
        continue;
      }
      
      await tap.wait(1000);
      await tap.click("Execute");
      await tap.wait(3000);
      results.push({ tool: toolName, status: 'executed' });
    }
    
    return { toolsExecuted: results.length, results };
  }
};
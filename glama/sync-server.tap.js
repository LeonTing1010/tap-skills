export default {
  site: "glama",
  name: "sync-server",
  description: "Sync Glama MCP server with latest GitHub data — updates commit SHA, LICENSE, README detection",
  args: {
    owner: { type: "string", description: "GitHub owner" },
    repo: { type: "string", description: "GitHub repo name" }
  },
  run: async (tap, args) => {
    const owner = args.owner || "LeonTing1010";
    const repo = args.repo || "tap";
    
    await tap.nav(`https://glama.ai/mcp/servers/${owner}/${repo}/admin/repository`);
    await tap.wait(3000);
    
    // Get current sync state
    const before = await tap.eval(`
      const text = document.body.innerText;
      const commit = text.match(/Last commit:\\s*(\\w+)/);
      const synced = text.match(/Last synced:\\s*([\\d-]+\\s*[\\d:]*)/);
      JSON.stringify({ lastCommit: commit?.[1], lastSynced: synced?.[1] });
    `);
    
    // Click Sync Server
    await tap.click("Sync Server");
    await tap.wait(10000);
    
    // Reload and check updated state
    await tap.nav(`https://glama.ai/mcp/servers/${owner}/${repo}/admin/repository`);
    await tap.wait(3000);
    
    const after = await tap.eval(`
      const text = document.body.innerText;
      const commit = text.match(/Last commit:\\s*(\\w+)/);
      const synced = text.match(/Last synced:\\s*([\\d-]+\\s*[\\d:]*)/);
      JSON.stringify({ lastCommit: commit?.[1], lastSynced: synced?.[1] });
    `);
    
    return { before: JSON.parse(before), after: JSON.parse(after) };
  }
};
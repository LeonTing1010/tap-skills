export default {
  site: "glama",
  name: "add-related",
  intent: "write",
  description: "Search and add related servers to a Glama MCP server listing",
  columns: ["query", "results", "added", "toast"],
  args: {
    owner: { type: "string", description: "GitHub owner" },
    repo: { type: "string", description: "GitHub repo name" },
    query: { type: "string", description: "Search query for related servers (e.g. 'playwright', 'puppeteer')" }
  },
  tap: async (tap, args) => {
    const owner = args.owner || "LeonTing1010";
    const repo = args.repo || "tap";
    const query = args.query;
    if (!query) return { error: "query is required" };
    
    await tap.nav(`https://glama.ai/mcp/servers/${owner}/${repo}/related-servers`);
    await tap.wait(3000);
    
    // Click Suggest Server
    await tap.click("Suggest Server");
    await tap.wait(1000);
    
    // Type search query
    await tap.type('input[placeholder="Search"]', query);
    await tap.wait(2000);
    
    // Get search results
    const results = await tap.eval(`
      const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.trim() === 'Suggest' && b.offsetParent !== null);
      btns.map((btn, i) => {
        let el = btn.parentElement;
        for (let j = 0; j < 5; j++) {
          const text = el?.textContent?.trim();
          if (text && text.length > 10 && text.includes('Suggest')) {
            return { index: i, server: text.replace('Suggest', '').trim().substring(0, 80) };
          }
          el = el?.parentElement;
        }
        return { index: i, server: 'unknown' };
      });
    `);
    
    // Add the first result
    const added = await tap.eval(`
      const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.trim() === 'Suggest' && b.offsetParent !== null);
      if (btns[0]) { btns[0].click(); 'added' } else { 'no results' }
    `);
    await tap.wait(1500);
    
    const toast = await tap.eval(`
      const toasts = document.querySelectorAll('[data-scope="toast"] [data-part="title"]');
      Array.from(toasts).map(t => t.textContent.trim())[0] || 'no toast';
    `);
    
    return { query, results, added, toast };
  }
};
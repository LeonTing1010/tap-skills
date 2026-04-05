export default {
  site: "glama",
  name: "check-score",
  description: "Check Glama MCP server score — returns all score items with pass/fail status",
  args: {
    owner: { type: "string", description: "GitHub owner (e.g. LeonTing1010)" },
    repo: { type: "string", description: "GitHub repo name (e.g. tap)" }
  },
  run: async (tap, args) => {
    const owner = args.owner || "LeonTing1010";
    const repo = args.repo || "tap";
    
    await tap.nav(`https://glama.ai/mcp/servers/${owner}/${repo}/score`);
    await tap.wait(3000);
    
    const scores = await tap.eval(`
      const items = document.querySelectorAll('button[class*="ULqjq"]');
      Array.from(items).map(b => {
        const svg = b.querySelector('svg');
        const stroke = svg?.getAttribute('stroke') || '';
        const status = stroke.includes('fe4a4b') ? 'FAIL' : stroke.includes('00d992') ? 'PASS' : 'PENDING';
        return { status, item: b.textContent.trim() };
      });
    `);
    
    const pass = scores.filter(s => s.status === 'PASS').length;
    const fail = scores.filter(s => s.status === 'FAIL').length;
    const pending = scores.filter(s => s.status === 'PENDING').length;
    
    return { summary: `${pass} PASS / ${fail} FAIL / ${pending} PENDING`, scores };
  }
};
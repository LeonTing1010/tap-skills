export default {
  site: "glama",
  name: "submit",
  description: "Submit an MCP server to Glama directory",
  columns: ["status", "url"],
  args: {
    name: { type: "string", description: "Server name (e.g. 'Tap')" },
    repoUrl: { type: "string", description: "GitHub repository URL" }
  },

  async run(page, args) {
    if (!args.repoUrl) throw new Error('repoUrl is required')

    await page.nav('https://glama.ai/mcp/servers')
    await page.wait(3000)

    // Click Add Server button
    await page.eval(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Add Server'));
      if (btn) btn.click();
    })
    await page.wait(1000)

    // Fill the dialog form via native setters (CSP may block scripting)
    await page.eval((name, repoUrl) => {
      function setInput(id, val) {
        const el = document.getElementById(id);
        if (!el || !val) return;
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      // Glama uses dynamic IDs — find by placeholder instead
      const inputs = document.querySelectorAll('input');
      for (const input of inputs) {
        if (input.placeholder?.includes('github.com')) {
          const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
          s.call(input, repoUrl);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (input.placeholder?.includes('My MCP Server') && name) {
          const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
          s.call(input, name);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }, args.name, args.repoUrl)
    await page.wait(500)

    // Click Submit for Review
    await page.eval(() => {
      const btn = [...document.querySelectorAll('button[type="submit"]')].find(b => b.textContent.includes('Submit'));
      if (btn) btn.click();
    })
    await page.wait(3000)

    const url = await page.eval(() => location.href)
    return [{ status: 'submitted', url: String(url) }]
  }
}

export default {
  site: "clawhub",
  name: "publish",
  description: "Publish a skill to OpenClaw ClawHub",
  columns: ["status", "url"],
  args: {
    slug: { type: "string", description: "Skill slug (e.g. 'tap')" },
    displayName: { type: "string", description: "Display name (e.g. 'Tap')" },
    version: { type: "string", description: "Semver version (e.g. '0.1.0')" },
    skillFile: { type: "string", description: "Absolute path to SKILL.md file" },
    changelog: { type: "string", description: "Changelog text" }
  },

  async run(page, args) {
    if (!args.slug || !args.skillFile) throw new Error('slug and skillFile are required')

    await page.nav('https://clawhub.ai/publish-skill')
    await page.wait(2000)

    // Fill form fields via native setters
    await page.eval((slug, displayName, version) => {
      function setInput(sel, val) {
        const el = document.querySelector(sel);
        if (!el || !val) return;
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      setInput('#slug', slug);
      setInput('#displayName', displayName || slug);
      setInput('#version', version || '0.1.0');
    }, args.slug, args.displayName, args.version)

    // Strip webkitdirectory and upload file
    await page.eval(() => {
      const input = document.querySelector('#upload-files');
      if (input) {
        input.removeAttribute('webkitdirectory');
        input.removeAttribute('directory');
      }
    })
    await page.upload('#upload-files', args.skillFile)
    await page.wait(500)

    // Trigger change event for file recognition
    await page.eval(() => {
      document.querySelector('#upload-files')?.dispatchEvent(new Event('change', { bubbles: true }));
    })
    await page.wait(500)

    // Check agreement checkbox
    await page.click('input[type="checkbox"]')

    // Fill changelog
    if (args.changelog) {
      await page.eval((text) => {
        const ta = document.querySelector('#changelog');
        if (!ta) return;
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
        setter.call(ta, text);
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      }, args.changelog)
    }
    await page.wait(500)

    // Click Publish
    await page.click('button.btn.btn-primary')
    await page.wait(5000)

    const url = await page.eval(() => location.href)
    const published = url.includes('/leonting1010/') || url.includes('/publish')

    return [{ status: published ? 'published' : 'check-browser', url: String(url) }]
  }
}

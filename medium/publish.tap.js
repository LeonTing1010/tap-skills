export default {
  site: "medium",
  name: "publish",
  intent: "write",
  description: "Publish an article on Medium by importing from a URL",
  columns: ["status", "url"],
  args: {
    source_url: { type: "string", description: "URL of the article to import (must be publicly accessible)" }
  },

  async tap(tap, args) {
    if (!args.source_url) {
      return [{ status: "error", url: "missing source_url — provide the public URL of the article to import" }]
    }

    // Navigate to Medium's import page
    await tap.nav("https://medium.com/p/import")
    await tap.wait(2000)

    // The URL input is a div[role="textbox"], not a regular input
    // Use execCommand to inject the URL (React controlled component)
    const injected = await tap.eval(`
      (() => {
        const textboxes = Array.from(document.querySelectorAll('[role="textbox"]'));
        const urlBox = textboxes.find(el => el.textContent?.includes('yoursite') || el.textContent?.trim() === '');
        if (!urlBox) return 'not found';
        urlBox.focus();
        urlBox.textContent = '';
        const result = document.execCommand('insertText', false, ${JSON.stringify(args.source_url)});
        return result ? 'ok:' + urlBox.textContent : 'execCommand failed';
      })()
    `)

    if (!injected.startsWith('ok:')) {
      return [{ status: "error", url: "could not fill import URL: " + injected }]
    }

    // Click Import button
    await tap.click("Import")
    await tap.wait(6000)

    // Click Publish in the preview dialog
    await tap.click("Publish")
    await tap.wait(5000)

    // Get the published URL
    const url = await tap.eval("location.href")
    const published = url.includes('/p/') && !url.includes('/import')

    return [{
      status: published ? "published" : "check-browser",
      url: url.split('?')[0]
    }]
  }
}

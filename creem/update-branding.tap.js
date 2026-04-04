export default {
  site: "creem",
  name: "update-branding",
  description: "Update Creem store checkout branding — theme, accent colors, and logo",
  columns: ["success", "theme", "accent", "accentHover", "textColor"],
  args: {
    theme:      { type: "string", default: "", description: "light or dark" },
    accent:     { type: "string", default: "", description: "Hex accent color, e.g. #d97706" },
    accentHover:{ type: "string", default: "", description: "Hex hover color, e.g. #b45309" },
    textColor:  { type: "string", default: "", description: "Hex text color, e.g. #ffffff" },
    logoPath:   { type: "string", default: "", description: "Absolute path to logo image" },
  },
  examples: [{ theme: "dark", accent: "#d97706", accentHover: "#b45309", textColor: "#ffffff" }],

  async run(tap, args) {
    const { theme, accent, accentHover, textColor, logoPath } = args

    await tap.nav("https://www.creem.io/dashboard/settings/branding")
    await tap.waitFor("text=Checkout Branding")

    // Upload logo
    if (logoPath) {
      await tap.upload('input[type="file"][accept="image/*"]', logoPath)
      await tap.wait(2000)
    }

    // Set theme
    if (theme) {
      await tap.click(theme === "dark" ? "Dark" : "Light")
      await tap.wait(500)
    }

    // Parse hex → [R, G, B]
    function hexToRgb(hex) {
      const h = hex.replace("#", "")
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
    }

    // Set one color via Radix popover → Advanced → RGB sliders
    async function setColor(currentHex, r, g, b) {
      // Open color popover with pointer events (Radix requires it)
      await tap.eval(`(() => {
        const spans = Array.from(document.querySelectorAll('span.font-mono.text-foreground'));
        const badge = spans.find(s => s.textContent.trim() === '${currentHex}');
        const btn = badge?.closest('button');
        if (btn) {
          btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse' }));
          btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          btn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse' }));
          btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
          btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      })()`)
      await tap.wait(800)

      // Switch to Advanced (RGB) tab
      await tap.eval(`(() => {
        const dialog = document.querySelector('[role="dialog"][data-state="open"]');
        if (dialog) {
          const adv = Array.from(dialog.querySelectorAll('button')).find(b => b.textContent.includes('Advanced'));
          if (adv) adv.click();
        }
      })()`)
      await tap.wait(500)

      // Set RGB values via number inputs
      await tap.eval(`(() => {
        const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
        const dialog = dialogs.find(d => d.querySelectorAll('input[type="number"]').length === 3);
        const inputs = Array.from(dialog.querySelectorAll('input[type="number"]'));
        [${r}, ${g}, ${b}].forEach((val, i) => {
          inputs[i].focus(); inputs[i].select();
          document.execCommand('insertText', false, String(val));
          inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
          inputs[i].dispatchEvent(new Event('change', { bubbles: true }));
        });
      })()`)
      await tap.wait(500)
      await tap.pressKey("Escape")
      await tap.wait(300)
    }

    // Read current color hex values from badges
    const readColors = () => tap.eval(`
      Array.from(document.querySelectorAll('span.font-mono.text-foreground'))
        .map(s => s.textContent.trim()).filter(c => c.startsWith('#'))
    `)

    if (accent) {
      const colors = await readColors()
      const [r, g, b] = hexToRgb(accent)
      await setColor(colors[0], r, g, b)
    }

    if (accentHover) {
      const colors = await readColors()
      const [r, g, b] = hexToRgb(accentHover)
      await setColor(colors[1], r, g, b)
    }

    if (textColor) {
      const colors = await readColors()
      const [r, g, b] = hexToRgb(textColor)
      await setColor(colors[2], r, g, b)
    }

    await tap.click("Save Changes")
    await tap.wait(2000)

    return [{ success: true, theme: theme || "unchanged", accent: accent || "unchanged", accentHover: accentHover || "unchanged", textColor: textColor || "unchanged" }]
  }
}

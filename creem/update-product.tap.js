export default {
  site: "creem",
  name: "update-product",
  intent: "write",
  description: "Update Creem product — description, image, and return URL",
  columns: ["success", "productId", "name"],
  args: {
    productId:   { type: "string", description: "Creem product ID, e.g. prod_5kjYiJhOb4MsyrNUN4IbXu" },
    description: { type: "string", default: "", description: "New product description (supports markdown)" },
    imagePath:   { type: "string", default: "", description: "Absolute path to product image" },
    returnUrl:   { type: "string", default: "", description: "Post-payment redirect URL" },
  },
  examples: [{ productId: "prod_5kjYiJhOb4MsyrNUN4IbXu", description: "Forge taps with your own AI key." }],

  async tap(tap, args) {
    const { productId, description, imagePath, returnUrl } = args
    if (!productId) throw new Error("productId is required")

    // Navigate directly to product edit page
    await tap.nav(`https://www.creem.io/dashboard/products/edit/${productId}`)
    await tap.waitFor("text=Edit Your Product")

    // Get current product name for return value
    const productName = await tap.eval(`
      document.querySelector('input[id="name"], input[placeholder*="name"]')?.value || ''
    `)

    // Update description
    if (description) {
      await tap.eval(`(() => {
        const desc = document.getElementById('description');
        if (desc) {
          desc.focus();
          document.execCommand('selectAll', false);
          document.execCommand('insertText', false, ${JSON.stringify(description)});
        }
      })()`)
      await tap.wait(500)
    }

    // Update return URL
    if (returnUrl) {
      await tap.eval(`(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        const urlInput = inputs.find(i => i.value?.includes('taprun.dev') || i.placeholder?.includes('URL') || i.id?.includes('return'));
        if (urlInput) {
          urlInput.focus();
          document.execCommand('selectAll', false);
          document.execCommand('insertText', false, ${JSON.stringify(returnUrl)});
        }
      })()`)
      await tap.wait(500)
    }

    // Upload product image
    if (imagePath) {
      await tap.upload('#file-upload-handle', imagePath)
      await tap.wait(3000)
    }

    // Save
    await tap.click("Save Product")
    await tap.wait(3000)

    return [{ success: true, productId, name: productName }]
  }
}

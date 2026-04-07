export default {
  site: "xiaohongshu",
  name: "publish_text",
  intent: "write",
  description: "Publish text-only Xiaohongshu note (no images, uses auto-generated text card)",
  columns: ["status", "url"],
  args: {
    title: { type: "string" },
    content: { type: "string" }
  },

  async tap(tap, args) {
    const title = String(args.title || "").substring(0, 20)
    const content = String(args.content || "")
    if (!title || !content) return [{ status: "error", url: "title and content required" }]

    // 1. Navigate to publish page
    await tap.nav("https://creator.xiaohongshu.com/publish/publish")
    await tap.wait(2000)

    // 2. Switch to "上传图文" tab
    await tap.click("上传图文")
    await tap.wait(1000)

    // 3. Click "文字配图" to create text card image
    await tap.click("文字配图")
    await tap.wait(2000)

    // 4. Insert content into the card editor (paste-style, not char-by-char)
    await tap.eval(`(function() {
      var el = document.querySelector('.card-editor-container');
      if (!el) return 'editor not found';
      el.focus();
      document.execCommand('insertText', false, ${JSON.stringify(content)});
      return 'inserted';
    })()`)
    await tap.wait(1000)

    // 5. Generate image — click then wait for preview page
    await tap.click("生成图片")
    await tap.wait(6000)

    // 6. Click "下一步" — may need retry as page transitions
    let nextClicked = false
    for (let i = 0; i < 3; i++) {
      try {
        await tap.click("下一步")
        nextClicked = true
        break
      } catch { await tap.wait(2000) }
    }
    if (!nextClicked) return [{ status: "error", url: "下一步 button not found" }]
    await tap.wait(3000)

    // 7. Fill title (use native setter for Vue reactivity)
    await tap.eval(`(function() {
      var input = document.querySelector('input.d-text');
      if (!input) return 'no title input';
      var setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, ${JSON.stringify(title)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return 'ok';
    })()`)
    await tap.wait(500)

    // 8. Click publish button (specific selector to avoid hitting other "发布" text)
    await tap.eval(`(function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        if (btns[i].textContent.trim() === '发布' && btns[i].className.includes('d-button')) {
          btns[i].scrollIntoView({ block: 'center' });
          btns[i].click();
          return 'clicked';
        }
      }
      return 'not found';
    })()`)
    await tap.wait(5000)

    // 9. Check result
    const url = await tap.eval("location.href")
    return [{
      status: String(url).includes('/publish/success') ? 'published' : 'check-browser',
      url: String(url)
    }]
  }
}

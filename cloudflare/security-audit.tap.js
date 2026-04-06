export default {
  site: "cloudflare",
  name: "security-audit",
  description: "Audit Cloudflare security settings — SSL mode, HSTS, TLS, bot protection",
  url: "https://dash.cloudflare.com",
  columns: ["setting", "value", "status"],
  health: { min_rows: 6, non_empty: ["setting", "value"] },
  run: async (tap) => {
    // ── 1. SSL/TLS Overview ──
    await tap.nav("https://dash.cloudflare.com/?to=/:account/taprun.dev/ssl-tls");
    await tap.wait(5000);

    const sslMode = await tap.eval(() => {
      const body = document.body.innerText;
      // SSL mode is on a separate line after "当前加密模式："
      const m = body.match(/当前加密模式[：:]\s*\n?\s*(.+)/);
      if (m) return m[1].trim();
      // Fallback: look for known mode names
      for (const mode of ['完全（严格）', '完全', '灵活', '关闭']) {
        if (body.includes('加密模式') && body.includes(mode)) return mode;
      }
      return 'unknown';
    });

    // ── 2. Edge Certificates ──
    await tap.nav("https://dash.cloudflare.com/?to=/:account/taprun.dev/ssl-tls/edge-certificates");
    await tap.wait(4000);
    await tap.eval(() => window.scrollBy(0, 800));
    await tap.wait(1000);

    const edge = await tap.eval(() => {
      const r = {};
      const body = document.body.innerText;

      // Always HTTPS
      const inputs = [...document.querySelectorAll('input[type="checkbox"]')];
      for (const inp of inputs) {
        const sec = inp.closest('div')?.parentElement?.parentElement;
        if (sec?.textContent?.includes('始终使用 HTTPS')) { r.https = inp.checked; break; }
      }

      // Min TLS
      const tlsBtn = document.querySelector('#downshift-0-toggle-button');
      r.tls = tlsBtn?.textContent?.trim() || 'unknown';

      // HSTS
      r.hsts = body.includes('状态：开') || body.includes('状态： 开');
      r.maxAge = (body.match(/最长期限[：:]\s*(.+?)(?:\n|$)/)?.[1] || '').trim();
      r.sub = body.includes('包括子域：开') || body.includes('包括子域： 开');
      r.preload = body.includes('预加载：开') || body.includes('预加载： 开');

      // TLS 1.3
      const t13 = [...document.querySelectorAll('span')].find(e => e.textContent === 'TLS 1.3');
      if (t13) {
        const p = t13.closest('div')?.parentElement?.parentElement;
        const tog = p?.querySelector('input[type="checkbox"]');
        r.tls13 = tog?.checked ?? null;
      }
      return r;
    });

    // ── 3. Security Settings — Bot Fight Mode ──
    await tap.nav("https://dash.cloudflare.com/?to=/:account/taprun.dev/security/settings");
    await tap.wait(5000);
    // Click bot traffic filter to load bot settings
    await tap.eval(() => {
      const btns = [...document.querySelectorAll('button')];
      const btn = btns.find(b => b.textContent.trim() === '自动程序流量');
      if (btn) btn.click();
    });
    await tap.wait(3000);
    // Scroll to reveal Bot Fight Mode
    await tap.eval(() => window.scrollTo(0, document.body.scrollHeight));
    await tap.wait(2000);

    const bot = await tap.eval(() => {
      const body = document.body.innerText;
      if (!body.includes('自动程序攻击模式')) return 'not visible';
      // Find the exact element and its sibling toggle
      const all = [...document.querySelectorAll('*')];
      const el = all.find(e => e.childNodes.length === 1 && e.textContent === '自动程序攻击模式');
      if (!el) return 'element not found';
      // Walk up to the card container and find checkbox
      let node = el;
      for (let i = 0; i < 8; i++) {
        node = node.parentElement;
        if (!node) break;
        const inp = node.querySelector('input[type="checkbox"]');
        if (inp) return inp.checked ? 'ON' : 'OFF';
      }
      return 'toggle not found';
    });

    const ok = v => v === true || v === 'ON' ? '✓' : '✗';
    return [
      { setting: 'SSL/TLS Mode', value: String(sslMode), status: sslMode.includes('严格') ? '✓' : '⚠' },
      { setting: 'Always HTTPS', value: edge.https ? 'ON' : 'OFF', status: ok(edge.https) },
      { setting: 'Min TLS Version', value: String(edge.tls), status: edge.tls?.includes('1.2') ? '✓' : '⚠' },
      { setting: 'TLS 1.3', value: edge.tls13 ? 'ON' : 'OFF', status: ok(edge.tls13) },
      { setting: 'HSTS', value: edge.hsts ? 'ON' : 'OFF', status: ok(edge.hsts) },
      { setting: 'HSTS Max-Age', value: String(edge.maxAge), status: edge.maxAge?.includes('6') ? '✓' : '⚠' },
      { setting: 'HSTS Subdomains', value: edge.sub ? 'ON' : 'OFF', status: ok(edge.sub) },
      { setting: 'HSTS Preload', value: edge.preload ? 'ON' : 'OFF', status: ok(edge.preload) },
      { setting: 'Bot Fight Mode', value: String(bot), status: ok(bot) },
    ];
  }
}

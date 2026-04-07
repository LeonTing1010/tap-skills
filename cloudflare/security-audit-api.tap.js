export default {
  site: "cloudflare",
  name: "security-audit-api",
  description: "Audit Cloudflare security via API — SSL, HSTS, TLS, bot protection. Stable, no browser.",
  url: "https://api.cloudflare.com",
  columns: ["setting", "value", "status"],
  health: { min_rows: 8, non_empty: ["setting", "value"] },
  args: {
    zone_id: { type: "string", description: "Cloudflare Zone ID (find at dash.cloudflare.com → your domain → Overview, right sidebar)" },
    token: { type: "string", description: "Cloudflare API Token (Zone Settings:Read)" }
  },
  run: async (tap, args) => {
    const zone = args.zone_id;
    const token = args.token;
    if (!token) throw new Error("Missing --token. Create at dash.cloudflare.com/profile/api-tokens (Zone Settings:Read).");

    const base = `https://api.cloudflare.com/client/v4/zones/${zone}/settings`;
    const opts = { headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } };

    // Fetch all settings via Cloudflare API
    const [ssl, hsts, minTls, tls13, https, botFight] = await Promise.all([
      tap.fetch(`${base}/ssl`, opts),
      tap.fetch(`${base}/security_header`, opts),
      tap.fetch(`${base}/min_tls_version`, opts),
      tap.fetch(`${base}/tls_1_3`, opts),
      tap.fetch(`${base}/always_use_https`, opts),
      tap.fetch(`${base}/security_level`, opts),
    ]);

    const v = (res) => res?.result?.value;
    const sslMode = v(ssl) || 'unknown';
    const httpsOn = v(https) === 'on';
    const tlsMin = v(minTls) || 'unknown';
    const tls13On = v(tls13) === 'on' || v(tls13) === 'zrt';
    const secLevel = v(botFight) || 'unknown';

    // HSTS is nested
    const hstsData = v(hsts)?.strict_transport_security || {};
    const hstsOn = hstsData.enabled === true;
    const maxAge = hstsData.max_age || 0;
    const maxAgeLabel = maxAge === 0 ? '0 (disabled)' :
      maxAge <= 2592000 ? `${Math.round(maxAge/2592000)} month` :
      `${Math.round(maxAge/2592000)} months`;
    const subDomains = hstsData.include_subdomains === true;
    const preload = hstsData.preload === true;

    const sslLabels = { off: '关闭', flexible: '灵活', full: '完全', strict: '完全（严格）' };
    const sslLabel = sslLabels[sslMode] || sslMode;

    const ok = v => v === true ? '✓' : '✗';
    return [
      { setting: 'SSL/TLS Mode', value: sslLabel, status: sslMode === 'strict' ? '✓' : '⚠' },
      { setting: 'Always HTTPS', value: httpsOn ? 'ON' : 'OFF', status: ok(httpsOn) },
      { setting: 'Min TLS Version', value: tlsMin, status: tlsMin === '1.2' ? '✓' : '⚠' },
      { setting: 'TLS 1.3', value: tls13On ? 'ON' : 'OFF', status: ok(tls13On) },
      { setting: 'HSTS', value: hstsOn ? 'ON' : 'OFF', status: ok(hstsOn) },
      { setting: 'HSTS Max-Age', value: `${maxAge}s (${maxAgeLabel})`, status: maxAge >= 15552000 ? '✓' : '⚠' },
      { setting: 'HSTS Subdomains', value: subDomains ? 'ON' : 'OFF', status: ok(subDomains) },
      { setting: 'HSTS Preload', value: preload ? 'ON' : 'OFF', status: ok(preload) },
      { setting: 'Security Level', value: secLevel, status: secLevel !== 'off' ? '✓' : '✗' },
    ];
  }
}

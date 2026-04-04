const site = "creem";
const name = "products";
const description = "List all Creem products with status, price, and subscriptions";
const columns = ["name", "id", "price", "billing", "status", "subscriptions", "mode"];
const args = {
  key: { type: "string", required: true, description: "Creem API key (creem_xxx or creem_test_xxx)" },
};
const health = { min_rows: 1, non_empty: ["name", "id"] };
const examples = [{ key: "creem_test_xxx" }];

async function run(tap, args) {
  const isTest = args.key.startsWith("creem_test_");
  const api = isTest ? "https://test-api.creem.io/v1" : "https://api.creem.io/v1";

  const resp = await fetch(`${api}/products/search`, {
    headers: { "x-api-key": args.key },
  });
  const data = await resp.json();

  return (data.items || []).map(p => ({
    name: p.name,
    id: p.id,
    price: `$${(p.price / 100).toFixed(2)}${p.billing_type === "recurring" ? "/mo" : ""}`,
    billing: p.billing_type,
    status: p.status,
    subscriptions: String(p.subscriptions_count || 0),
    mode: p.mode,
  }));
}


export default { site, name, description, columns, args, health, examples, run };

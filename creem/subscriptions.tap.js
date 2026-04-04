const site = "creem";
const name = "subscriptions";
const description = "List all Creem subscriptions with customer, product, and status";
const columns = ["email", "product", "status", "price", "period_end", "id"];
const args = {
  key: { type: "string", required: true, description: "Creem API key" },
};
const health = { min_rows: 1 };
const examples = [{ key: "creem_test_xxx" }];

async function run(tap, args) {
  const isTest = args.key.startsWith("creem_test_");
  const api = isTest ? "https://test-api.creem.io/v1" : "https://api.creem.io/v1";

  const resp = await fetch(`${api}/subscriptions/search`, {
    headers: { "x-api-key": args.key },
  });
  const data = await resp.json();

  return (data.items || []).map(s => ({
    email: s.customer?.email || "unknown",
    product: s.product?.name || s.product?.id || "unknown",
    status: s.status,
    price: `$${((s.product?.price || 0) / 100).toFixed(2)}/mo`,
    period_end: (s.current_period_end_date || "").slice(0, 10),
    id: s.id,
  }));
}


export default { site, name, description, columns, args, health, examples, run };

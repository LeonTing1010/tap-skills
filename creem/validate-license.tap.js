const site = "creem";
const name = "validate-license";
const description = "Validate a Creem license key and check activation status";
const columns = ["key", "status", "product", "activation", "limit", "expires", "instance"];
const args = {
  key: { type: "string", required: true, description: "Creem API key" },
  license: { type: "string", required: true, description: "License key to validate" },
  instance: { type: "string", required: true, description: "Instance ID (from activate)" },
};
const examples = [{ key: "creem_test_xxx", license: "BY5D0-xxx", instance: "lki_xxx" }];

async function run(tap, args) {
  const isTest = args.key.startsWith("creem_test_");
  const api = isTest ? "https://test-api.creem.io/v1" : "https://api.creem.io/v1";

  const resp = await fetch(`${api}/licenses/validate`, {
    method: "POST",
    headers: {
      "x-api-key": args.key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: args.license,
      instance_id: args.instance,
    }),
  });
  const data = await resp.json();

  if (data.error || data.statusCode) {
    return [{
      key: args.license.slice(0, 10) + "...",
      status: "invalid",
      product: data.message || data.error,
      activation: "", limit: "", expires: "", instance: "",
    }];
  }

  return [{
    key: data.key?.slice(0, 10) + "...",
    status: data.status,
    product: data.product_id,
    activation: String(data.activation || 0),
    limit: String(data.activation_limit || "∞"),
    expires: (data.expires_at || "").slice(0, 10),
    instance: data.instance?.name || data.instance?.id || "",
  }];
}


export default { site, name, description, columns, args, examples, run };

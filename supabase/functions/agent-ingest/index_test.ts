import "https://deno.land/std@0.224.0/dotenv/load.ts";

const URL = `${Deno.env.get("VITE_SUPABASE_URL") ?? "http://localhost:54321"}/functions/v1/agent-ingest`;
const KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "test";

Deno.test("agent-ingest validates body", async () => {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({}),
  });
  await res.text();
  if (![400, 401].includes(res.status)) {
    throw new Error(`unexpected status ${res.status}`);
  }
});
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const URL = `${Deno.env.get("VITE_SUPABASE_URL") ?? "http://localhost:54321"}/functions/v1/ai-agent`;
const KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "test";

Deno.test("ai-agent handles CORS preflight", async () => {
  const res = await fetch(URL, { method: "OPTIONS" });
  await res.text();
  assertEquals(res.status, 200);
});

Deno.test("ai-agent rejects malformed body", async () => {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: "not-json",
  });
  await res.text();
  if (![400, 401, 500].includes(res.status)) {
    throw new Error(`unexpected ${res.status}`);
  }
});
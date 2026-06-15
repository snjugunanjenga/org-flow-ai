import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const URL = `${Deno.env.get("VITE_SUPABASE_URL") ?? "http://localhost:54321"}/functions/v1/connector-dispatch`;
const KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "test";

Deno.test("connector-dispatch rejects invalid body", async () => {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ channel: "fax", to: "" }),
  });
  const body = await res.text();
  assertEquals(res.status, 400, body);
});

Deno.test("connector-dispatch accepts slack body", async () => {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ channel: "slack", to: "C123", text: "hello" }),
  });
  await res.text();
  if (![200, 401, 502].includes(res.status)) {
    throw new Error(`unexpected status ${res.status}`);
  }
});
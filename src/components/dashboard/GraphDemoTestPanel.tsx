import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, FlaskConical } from "lucide-react";

type Check = { ok: boolean; latency_ms: number; detail?: string; error?: string };
type OrgResult = {
  slug: string;
  name: string;
  ok: boolean;
  checks: { supabase: Check; neo4j: Check; pinecone: Check };
};

/**
 * Runs a sample Neo4j MATCH and a Pinecone topK similarity query against every
 * demo organization and renders pass/fail per backend per org. Used by judges
 * to verify graph + vector connectivity end-to-end in one click.
 */
export function GraphDemoTestPanel() {
  const [results, setResults] = useState<OrgResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.functions.invoke("graph-demo-test", { body: {} });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setResults((data as { results: OrgResult[] }).results ?? []);
  };

  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          <div>
            <h2 className="text-sm font-semibold">Knowledge Graph demo test</h2>
            <p className="text-xs text-muted-foreground">Sample Neo4j query + Pinecone similarity query per demo org.</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={run} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : null}
          {loading ? "Running…" : "Run tests"}
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {results && (
        <div className="space-y-2">
          {results.length === 0 && <p className="text-xs text-muted-foreground">No demo orgs found. Seed first.</p>}
          {results.map((r) => (
            <div key={r.slug} className="border border-border/40 rounded-lg p-3 bg-card/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{r.name}</span>
                <StatusPill ok={r.ok} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <CheckRow label="Supabase edges" c={r.checks.supabase} />
                <CheckRow label="Neo4j sample" c={r.checks.neo4j} />
                <CheckRow label="Pinecone topK" c={r.checks.pinecone} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-xs text-accent"><CheckCircle2 className="h-3.5 w-3.5" /> PASS</span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-destructive"><XCircle className="h-3.5 w-3.5" /> FAIL</span>
  );
}

function CheckRow({ label, c }: { label: string; c: Check }) {
  return (
    <div className="flex items-start gap-2">
      {c.ok ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-accent shrink-0" /> : <XCircle className="h-3.5 w-3.5 mt-0.5 text-destructive shrink-0" />}
      <div className="min-w-0">
        <div className="font-medium">{label} <span className="text-muted-foreground font-normal">({c.latency_ms} ms)</span></div>
        <div className="text-muted-foreground truncate" title={c.detail || c.error}>{c.detail || c.error || (c.ok ? "OK" : "fail")}</div>
      </div>
    </div>
  );
}
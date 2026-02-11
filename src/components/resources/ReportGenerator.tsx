import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2 } from "lucide-react";
import type { Source } from "@/components/resources/NotebookDetail";

interface Props {
  notebookId: string;
  orgId: string;
  sources: Source[];
}

const REPORT_TYPES = [
  { value: "briefing", label: "Executive Briefing" },
  { value: "faq", label: "FAQ Document" },
  { value: "study-guide", label: "Study Guide" },
];

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resource-ai`;

export function ReportGenerator({ notebookId, orgId, sources }: Props) {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("briefing");
  const { toast } = useToast();

  const generate = async () => {
    if (sources.length === 0) {
      toast({ variant: "destructive", title: "No sources", description: "Add sources first." });
      return;
    }
    setLoading(true);
    try {
      const sourceContext = sources
        .slice(0, 10)
        .map((s, i) => `[Source ${i + 1}: ${s.title}]\n${s.content.slice(0, 2000)}`)
        .join("\n\n---\n\n");

      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: "generate-report",
          report_type: type,
          source_context: sourceContext,
          notebook_id: notebookId,
        }),
      });

      if (!resp.ok) throw new Error("Failed to generate report");
      const data = await resp.json();
      setReport(data.report || "No report generated.");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center flex-wrap">
        {REPORT_TYPES.map((rt) => (
          <Button
            key={rt.value}
            variant={type === rt.value ? "default" : "outline"}
            size="sm"
            onClick={() => setType(rt.value)}
          >
            {rt.label}
          </Button>
        ))}
        <Button onClick={generate} disabled={loading || sources.length === 0} className="ml-auto">
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
          ) : (
            <><FileText className="h-4 w-4 mr-2" />Generate Report</>
          )}
        </Button>
      </div>

      {report && (
        <div className="glass-panel p-6 prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
          {report}
        </div>
      )}
    </div>
  );
}

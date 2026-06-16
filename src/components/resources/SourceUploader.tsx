import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, Link, FileText, Cloud } from "lucide-react";

interface Props {
  notebookId: string;
  orgId: string;
  onUploaded: () => void;
}

export function SourceUploader({ notebookId, orgId, onUploaded }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"cloud" | "file" | "text" | "url">("cloud");
  const [textContent, setTextContent] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [url, setUrl] = useState("");
  const [cloudUrl, setCloudUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Send the new source through the Memory Agent so it lands in Pinecone +
  // becomes a Topic node in the knowledge graph (with provenance edges).
  const linkToGraph = async (title: string, content: string, sourceTag: string) => {
    try {
      await supabase.functions.invoke("agent-ingest", {
        body: {
          source: `notebook:${notebookId}:${sourceTag}`,
          text: `${title}\n\n${content}`.slice(0, 12_000),
        },
        headers: { "X-Org-Id": orgId },
      });
    } catch (err) {
      console.warn("graph link failed", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setLoading(true);

    try {
      const filePath = `${orgId}/${notebookId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      // Read text content for text-based files
      let content = "";
      if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".json")) {
        content = await file.text();
      } else {
        content = `[Uploaded file: ${file.name}]`;
      }

      await supabase.from("resource_sources").insert({
        notebook_id: notebookId,
        org_id: orgId,
        source_type: file.type.includes("pdf") ? "pdf" : "file",
        title: file.name,
        content,
        file_url: urlData.publicUrl,
        metadata: { size: file.size, type: file.type },
      });

      await linkToGraph(file.name, content, "file");
      toast({ title: "Source uploaded", description: `${file.name} · linked to knowledge graph` });
      onUploaded();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message });
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleTextSubmit = async () => {
    if (!textContent.trim() || !textTitle.trim()) return;
    setLoading(true);
    try {
      await supabase.from("resource_sources").insert({
        notebook_id: notebookId,
        org_id: orgId,
        source_type: "text",
        title: textTitle.trim(),
        content: textContent.trim(),
        metadata: {},
      });
      await linkToGraph(textTitle.trim(), textContent.trim(), "text");
      toast({ title: "Text source added", description: "Linked to knowledge graph" });
      setTextContent("");
      setTextTitle("");
      onUploaded();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      await supabase.from("resource_sources").insert({
        notebook_id: notebookId,
        org_id: orgId,
        source_type: "url",
        title: url.trim(),
        content: `[URL source: ${url.trim()}]`,
        file_url: url.trim(),
        metadata: { url: url.trim() },
      });
      await linkToGraph(url.trim(), `[URL source: ${url.trim()}]`, "url");
      toast({ title: "URL source added", description: "Linked to knowledge graph" });
      setUrl("");
      onUploaded();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCloudSubmit = async () => {
    if (!cloudUrl.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("resource-source-fetch", {
        body: { notebook_id: notebookId, org_id: orgId, url: cloudUrl.trim() },
      });
      if (error) throw error;
      const provider = (data as any)?.provider ?? "source";
      toast({ title: "Source added", description: `Imported from ${provider}` });
      setCloudUrl("");
      onUploaded();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Could not import", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["cloud", "file", "text", "url"] as const).map((m) => (
          <Button
            key={m}
            variant={mode === m ? "default" : "outline"}
            size="sm"
            onClick={() => setMode(m)}
          >
            {m === "cloud" && <Cloud className="h-3.5 w-3.5 mr-1.5" />}
            {m === "file" && <Upload className="h-3.5 w-3.5 mr-1.5" />}
            {m === "text" && <FileText className="h-3.5 w-3.5 mr-1.5" />}
            {m === "url" && <Link className="h-3.5 w-3.5 mr-1.5" />}
            {m === "cloud" ? "Drive / SharePoint" : m.charAt(0).toUpperCase() + m.slice(1)}
          </Button>
        ))}
      </div>

      {mode === "cloud" && (
        <div className="space-y-2">
          <Input
            placeholder="Paste a Google Docs/Sheets/Drive, SharePoint, OneDrive or Outlook link"
            value={cloudUrl}
            onChange={(e) => setCloudUrl(e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">
              Tip — keep originals in your personal or org Drive/SharePoint so updates flow into the notebook. Links must be readable by your org's connected workspace account.
            </p>
            <Button onClick={handleCloudSubmit} disabled={loading || !cloudUrl.trim()}>
              {loading ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      )}

      {mode === "file" && (
        <div>
          <input
            ref={fileRef}
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.txt,.md,.json,.csv,.docx,.doc,.png,.jpg,.jpeg"
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full border-dashed h-20"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
          >
            <Upload className="h-5 w-5 mr-2 text-muted-foreground" />
            {loading ? "Uploading..." : "Click to upload a file"}
          </Button>
        </div>
      )}

      {mode === "text" && (
        <div className="space-y-2">
          <Input
            placeholder="Source title"
            value={textTitle}
            onChange={(e) => setTextTitle(e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
          <Textarea
            placeholder="Paste your text content here..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            rows={6}
            className="bg-secondary/50 border-border/50"
          />
          <Button onClick={handleTextSubmit} disabled={loading || !textContent.trim() || !textTitle.trim()}>
            {loading ? "Adding..." : "Add Text Source"}
          </Button>
        </div>
      )}

      {mode === "url" && (
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com/document"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
          <Button onClick={handleUrlSubmit} disabled={loading || !url.trim()}>
            {loading ? "Adding..." : "Add URL"}
          </Button>
        </div>
      )}
    </div>
  );
}

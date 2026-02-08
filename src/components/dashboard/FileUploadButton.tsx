import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgId } from "@/hooks/use-org-id";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, FileText, Image, File, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  created_at: string;
}

interface FileUploadButtonProps {
  resourceType: string;
  resourceId: string;
  attachments: Attachment[];
  onUpload: () => void;
}

const fileIcons: Record<string, any> = {
  pdf: FileText,
  image: Image,
};

function getFileIcon(type: string | null) {
  if (!type) return File;
  if (type.startsWith("image")) return Image;
  if (type.includes("pdf")) return FileText;
  return File;
}

export function FileUploadButton({ resourceType, resourceId, attachments, onUpload }: FileUploadButtonProps) {
  const { user } = useAuth();
  const orgId = useOrgId();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !orgId) return;

    setUploading(true);
    try {
      const path = `${user.id}/${resourceType}/${resourceId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);

      const { error: dbError } = await supabase.from("document_attachments").insert({
        org_id: orgId,
        resource_type: resourceType,
        resource_id: resourceId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: user.id,
      });
      if (dbError) throw dbError;

      toast({ title: "File uploaded" });
      onUpload();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("document_attachments").delete().eq("id", id);
    toast({ title: "Attachment removed" });
    onUpload();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
          Upload File
        </Button>
        <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md" />
      </div>
      {attachments.length > 0 && (
        <div className="space-y-1">
          {attachments.map(a => {
            const Icon = getFileIcon(a.file_type);
            return (
              <div key={a.id} className="flex items-center gap-2 p-1.5 rounded bg-muted/30 text-xs">
                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate flex-1">{a.file_name}</a>
                <button onClick={() => handleDelete(a.id)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="h-3 w-3" /></button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

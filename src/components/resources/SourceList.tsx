import { FileText, Link, Upload, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Source } from "@/components/resources/NotebookDetail";

interface Props {
  sources: Source[];
  pinnedIds: Set<string>;
  onTogglePin: (id: string) => void;
}

const typeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  text: FileText,
  url: Link,
  file: Upload,
};

export function SourceList({ sources, pinnedIds, onTogglePin }: Props) {
  if (sources.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No sources yet. Upload files, paste text, or add URLs above.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sources.map((s) => {
        const Icon = typeIcons[s.source_type] || FileText;
        const isPinned = pinnedIds.has(s.id);
        return (
          <div
            key={s.id}
            className={`glass-panel p-3 flex items-center gap-3 transition-all ${
              isPinned ? "ring-1 ring-primary/30" : ""
            }`}
          >
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{s.title}</p>
              <p className="text-[10px] text-muted-foreground">
                {s.source_type} · {new Date(s.created_at).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => onTogglePin(s.id)}
              title={isPinned ? "Unpin source" : "Pin source for chat context"}
            >
              {isPinned ? (
                <PinOff className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Pin className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

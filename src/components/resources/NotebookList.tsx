import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus } from "lucide-react";
import type { Notebook } from "@/pages/dashboard/ResourcesView";

interface Props {
  notebooks: Notebook[];
  loading: boolean;
  onSelect: (id: string) => void;
  onCreate: (title: string) => void;
}

export function NotebookList({ notebooks, loading, onSelect, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="New notebook title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && title.trim()) {
              onCreate(title.trim());
              setTitle("");
            }
          }}
          className="bg-secondary/50 border-border/50"
        />
        <Button
          onClick={() => {
            if (title.trim()) {
              onCreate(title.trim());
              setTitle("");
            }
          }}
          disabled={!title.trim()}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse-glow w-10 h-10 rounded-full bg-primary/20" />
        </div>
      ) : notebooks.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No notebooks yet</h3>
          <p className="text-muted-foreground text-sm">
            Create your first notebook to start uploading sources and asking questions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notebooks.map((nb) => (
            <button
              key={nb.id}
              onClick={() => onSelect(nb.id)}
              className="glass-panel p-5 text-left hover:ring-1 hover:ring-primary/30 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                    {nb.title}
                  </h3>
                  {nb.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {nb.description}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {new Date(nb.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

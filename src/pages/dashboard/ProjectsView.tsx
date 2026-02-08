import { FolderKanban } from "lucide-react";

export default function ProjectsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Projects</h1>
        <p className="text-muted-foreground mt-1">Track projects with AI-generated updates and milestone tracking.</p>
      </div>
      <div className="glass-panel p-12 flex flex-col items-center justify-center min-h-[400px]">
        <FolderKanban className="h-16 w-16 text-primary/30 mb-4" />
        <h3 className="text-lg font-semibold font-display mb-2">Project Management</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Projects with milestones, tasks, and agent-generated progress updates will be managed here.
        </p>
      </div>
    </div>
  );
}

import { Bell } from "lucide-react";

export default function NotificationsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Notifications</h1>
        <p className="text-muted-foreground mt-1">AI-routed notifications with reasoning context.</p>
      </div>
      <div className="glass-panel p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">No notifications yet. The Router Agent will surface important decisions and mentions here.</p>
        </div>
      </div>
    </div>
  );
}

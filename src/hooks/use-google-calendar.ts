import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface GoogleConnectionState {
  connected: boolean;
  loading: boolean;
  syncing: boolean;
}

export function useGoogleCalendar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<GoogleConnectionState>({
    connected: false,
    loading: true,
    syncing: false,
  });

  const checkConnection = useCallback(async () => {
    if (!user) return;
    setState(s => ({ ...s, loading: true }));
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-sync?action=check-connection`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const result = await res.json();
      setState(s => ({ ...s, connected: result.connected ?? false, loading: false }));
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, [user]);

  const startOAuth = useCallback(async () => {
    if (!user) return;
    try {
      const redirectUri = `${window.location.origin}/dashboard/calendar`;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-sync?action=auth-url`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ redirect_uri: redirectUri }),
        }
      );
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to get auth URL" });
      }
    } catch (err) {
      console.error("OAuth start error:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to start Google OAuth" });
    }
  }, [user, toast]);

  const exchangeCode = useCallback(async (code: string) => {
    if (!user) return false;
    try {
      const redirectUri = `${window.location.origin}/dashboard/calendar`;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-sync?action=callback`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ code, redirect_uri: redirectUri, user_id: user.id }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setState(s => ({ ...s, connected: true }));
        toast({ title: "Google Calendar connected!" });
        return true;
      }
      toast({ variant: "destructive", title: "Error", description: data.error || "Connection failed" });
      return false;
    } catch (err) {
      console.error("Code exchange error:", err);
      return false;
    }
  }, [user, toast]);

  const syncEvents = useCallback(async (orgId: string) => {
    if (!user) return;
    setState(s => ({ ...s, syncing: true }));
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-sync?action=sync-events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ org_id: orgId }),
        }
      );
      const data = await res.json();
      if (data.synced !== undefined) {
        toast({ title: `Synced ${data.synced} events from Google Calendar` });
      } else {
        toast({ variant: "destructive", title: "Sync failed", description: data.error });
      }
    } catch (err) {
      console.error("Sync error:", err);
      toast({ variant: "destructive", title: "Sync failed" });
    } finally {
      setState(s => ({ ...s, syncing: false }));
    }
  }, [user, toast]);

  const createMeetEvent = useCallback(async (params: {
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    attendees?: string[];
    org_id: string;
  }) => {
    if (!user) return null;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-sync?action=create-meet-event`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify(params),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast({ title: "Event created with Google Meet link!" });
        return data;
      }
      toast({ variant: "destructive", title: "Error", description: data.error });
      return null;
    } catch (err) {
      console.error("Create meet event error:", err);
      toast({ variant: "destructive", title: "Failed to create Meet event" });
      return null;
    }
  }, [user, toast]);

  const disconnect = useCallback(async () => {
    if (!user) return;
    try {
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-sync?action=disconnect`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({}),
        }
      );
      setState(s => ({ ...s, connected: false }));
      toast({ title: "Google Calendar disconnected" });
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  }, [user, toast]);

  return {
    ...state,
    checkConnection,
    startOAuth,
    exchangeCode,
    syncEvents,
    createMeetEvent,
    disconnect,
  };
}

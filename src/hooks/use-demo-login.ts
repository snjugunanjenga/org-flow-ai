import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { DemoPersona } from "@/lib/demo-personas";

/** Sign in as a seeded demo persona; auto-seed on first failure. */
export function useDemoLogin() {
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const loginAs = async (p: DemoPersona) => {
    setLoadingSlug(p.slug);
    try {
      // Always ensure persona is seeded first (idempotent) to avoid noisy 400s
      // from auth/v1/token when the account hasn't been provisioned yet.
      toast({ title: `Preparing ${p.org}…`, description: "One moment." });
      const { error: seedError } = await supabase.functions.invoke(p.seedFn, { body: {} });
      if (seedError) {
        toast({ variant: "destructive", title: "Demo unavailable", description: seedError.message });
        return;
      }
      const { error } = await signIn(p.email, p.password);
      if (error) {
        toast({ variant: "destructive", title: "Demo unavailable", description: error.message });
        return;
      }
      const dest = p.slug === "admin" ? "/dashboard/admin" : "/dashboard";
      navigate(dest);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e?.message ?? "Could not start demo." });
    } finally {
      setLoadingSlug(null);
    }
  };

  return { loginAs, loadingSlug };
}
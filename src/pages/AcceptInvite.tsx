import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Check, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { z } from "zod";

interface InvitationInfo {
  id: string;
  email: string;
  role: string;
  org_name: string;
  org_id: string;
  status: string;
}

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [signupMode, setSignupMode] = useState(false);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const { user, signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided.");
      setLoadingInvite(false);
      return;
    }
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      // Use a service-side lookup. For now, we query invitations + org name.
      // Since RLS allows any authenticated user to view invitations,
      // and unauthenticated users can't, we'll handle both cases.
      const { data, error: fetchError } = await supabase
        .from("invitations")
        .select("id, email, role, status, org_id")
        .eq("token", token!)
        .maybeSingle();

      if (fetchError || !data) {
        // If not authenticated, show signup form
        if (!user) {
          setSignupMode(true);
          setLoadingInvite(false);
          return;
        }
        setError("Invalid or expired invitation link.");
        setLoadingInvite(false);
        return;
      }

      if (data.status !== "pending") {
        setError("This invitation has already been used or expired.");
        setLoadingInvite(false);
        return;
      }

      // Get org name
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", data.org_id)
        .maybeSingle();

      setInvitation({
        id: data.id,
        email: data.email,
        role: data.role,
        org_name: org?.name || "Unknown Organization",
        org_id: data.org_id,
        status: data.status,
      });
      setLoadingInvite(false);
    } catch {
      setError("Failed to load invitation.");
      setLoadingInvite(false);
    }
  };

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      const { data, error: rpcError } = await supabase.rpc("accept_invitation", { _token: token });
      if (rpcError) throw rpcError;

      const result = data as unknown as { error?: string; success?: boolean };
      if (result?.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        setAccepting(false);
        return;
      }

      toast({ title: "Welcome!", description: `You've joined ${invitation?.org_name || "the organization"}.` });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setAccepting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;
    setAccepting(true);
    try {
      const schema = z.object({
        fullName: z.string().min(2),
        password: z.string().min(6),
      });
      schema.parse({ fullName, password });

      const { error: signUpError } = await signUp(invitation.email, password, fullName);
      if (signUpError) throw signUpError;

      toast({
        title: "Account created!",
        description: "Please check your email to verify, then come back to accept the invitation.",
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setAccepting(false);
    }
  };

  // After user logs in / signs up, re-check and auto-accept
  useEffect(() => {
    if (user && invitation && invitation.status === "pending") {
      handleAccept();
    }
    // If user just logged in but we haven't loaded the invite yet
    if (user && signupMode) {
      setSignupMode(false);
      loadInvitation();
    }
  }, [user]);

  if (loadingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-glow w-12 h-12 rounded-full bg-primary/20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />Back to home
        </button>

        <div className="glass-panel p-8">
          {error ? (
            <div className="text-center">
              <h2 className="text-xl font-bold font-display mb-2">Invitation Error</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => navigate("/auth")}>Go to Login</Button>
            </div>
          ) : signupMode && !user ? (
            <div>
              <h2 className="text-xl font-bold font-display mb-2">Create your account</h2>
              <p className="text-muted-foreground mb-6">Sign up to accept this invitation.</p>
              <Button onClick={() => navigate(`/auth?token=${token}`)} className="w-full">Sign In or Sign Up</Button>
            </div>
          ) : invitation && !user ? (
            <div>
              <h2 className="text-xl font-bold font-display mb-2">Join {invitation.org_name}</h2>
              <p className="text-muted-foreground mb-4">You've been invited as <strong>{invitation.role}</strong>.</p>
              <p className="text-sm text-muted-foreground mb-6">Please sign in or create an account to accept.</p>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={invitation.email} disabled className="pl-10 bg-secondary/50 border-border/50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={accepting}>
                  {accepting ? "Creating account..." : "Sign Up & Join"}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button onClick={() => navigate(`/auth?redirect=/accept-invite?token=${token}`)} className="text-sm text-primary hover:underline">
                  Already have an account? Sign in
                </button>
              </div>
            </div>
          ) : invitation && user ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold font-display mb-2">Join {invitation.org_name}</h2>
              <p className="text-muted-foreground mb-6">
                You've been invited to join as <strong>{invitation.role}</strong>.
              </p>
              <Button onClick={handleAccept} disabled={accepting} className="w-full">
                {accepting ? "Joining..." : "Accept Invitation"}
              </Button>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, User } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
});

const resetSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type Mode = "login" | "signup" | "reset";

const Auth = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "reset") {
        const parsed = resetSchema.parse({ email });
        const { error } = await resetPassword(parsed.email);
        if (error) {
          toast({ variant: "destructive", title: "Reset failed", description: error.message });
        } else {
          toast({ title: "Check your email", description: "We sent you a password reset link." });
          setMode("login");
        }
      } else if (mode === "login") {
        const parsed = loginSchema.parse({ email, password });
        const { error } = await signIn(parsed.email, parsed.password);
        if (error) {
          toast({
            variant: "destructive",
            title: "Sign in failed",
            description: error.message === "Invalid login credentials"
              ? "Incorrect email or password. Please try again."
              : error.message,
          });
        } else {
          navigate("/dashboard");
        }
      } else {
        const parsed = signupSchema.parse({ email, password, fullName });
        const { error } = await signUp(parsed.email, parsed.password, parsed.fullName);
        if (error) {
          const msg = error.message.includes("already registered")
            ? "An account with this email already exists. Try signing in instead."
            : error.message;
          toast({ variant: "destructive", title: "Sign up failed", description: msg });
        } else {
          toast({
            title: "Check your email",
            description: "We sent you a confirmation link. Please verify your email to continue.",
          });
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ variant: "destructive", title: "Validation error", description: err.errors[0].message });
      }
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<Mode, { h: string; p: string }> = {
    login: { h: "Welcome back", p: "Sign in to your AI Chief of Staff" },
    signup: { h: "Create your account", p: "Get started with your AI Chief of Staff" },
    reset: { h: "Reset password", p: "Enter your email and we'll send a reset link" },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </button>

        <div className="glass-panel p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold font-display gradient-text inline-block">{titles[mode].h}</h1>
            <p className="text-sm text-muted-foreground mt-2">{titles[mode].p}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="fullName" type="text" placeholder="Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" />
              </div>
            </div>

            {mode !== "reset" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "login" && (
                    <button type="button" onClick={() => setMode("reset")} className="text-xs text-primary hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 bg-secondary/50 border-border/50" />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {mode === "reset" ? (
              <button type="button" onClick={() => setMode("login")} className="text-sm text-primary hover:underline">
                Back to sign in
              </button>
            ) : (
              <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-sm text-primary hover:underline">
                {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;

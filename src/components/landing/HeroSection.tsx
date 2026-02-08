import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ParticleGraph } from "./ParticleGraph";
import { ArrowRight, Play, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const subtitles = [
  "Tracking every decision across your org",
  "Routing critical knowledge to the right people",
  "Detecting conflicts before they escalate",
  "Your living source of organizational truth",
];

export function HeroSection() {
  const [demoLoading, setDemoLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleTryDemo = async () => {
    setDemoLoading(true);
    try {
      const { error } = await signIn("steve.jobs@apple.com", "pass123#");
      if (error) {
        toast({
          variant: "destructive",
          title: "Demo unavailable",
          description: "Demo data hasn't been seeded yet. Please contact the admin.",
        });
      } else {
        navigate("/dashboard");
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not start demo." });
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <ParticleGraph />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background pointer-events-none" />

      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="inline-block px-4 py-1.5 mb-6 text-xs font-medium tracking-widest uppercase rounded-full border border-primary/30 bg-primary/10 text-primary">
            AI-Powered Organizational Intelligence
          </span>
        </motion.div>

        <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-bold font-display tracking-tight mb-6" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
          Your AI{" "}<span className="gradient-text">Chief of Staff</span>
        </motion.h1>

        <motion.div className="h-8 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }}>
          <AnimatedSubtitles items={subtitles} />
        </motion.div>

        <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.45 }}>
          <Button asChild size="lg" className="text-base px-8 py-6 rounded-xl bg-primary hover:bg-primary/90 shadow-lg">
            <Link to="/auth">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-base px-8 py-6 rounded-xl border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50"
            onClick={handleTryDemo}
            disabled={demoLoading}
          >
            {demoLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {demoLoading ? "Loading Demo..." : "Try the Demo"}
          </Button>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}

function AnimatedSubtitles({ items }: { items: string[] }) {
  return (
    <motion.p
      className="text-lg text-muted-foreground"
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 4, repeat: Infinity, repeatDelay: 0, times: [0, 0.1, 0.9, 1] }}
    >
      <SubtitleCycler items={items} />
    </motion.p>
  );
}

function SubtitleCycler({ items }: { items: string[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setIndex((i) => (i + 1) % items.length), 4000);
    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <motion.span key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5 }}>
      {items[index]}
    </motion.span>
  );
}

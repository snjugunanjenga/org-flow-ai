import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ParticleGraph } from "./ParticleGraph";
import { ArrowRight, Loader2, Sparkles, Apple, Flame, GitBranch, UserX, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { DEMO_PERSONAS } from "@/lib/demo-personas";
import { useDemoLogin } from "@/hooks/use-demo-login";

const subtitles = [
  "Your Second Brain for real life — work, study, and everything between",
  "Captures every decision, meeting, and message — versioned forever",
  "Routes what matters to the people who need it — automatically",
  "Flags conflicts and stale plans before they cost you",
];

const PERSONA_META: Record<string, { Icon: any; accentVar: string; tint: string }> = {
  apple:   { Icon: Apple,     accentVar: "hsl(var(--primary))",          tint: "from-primary/20" },
  founder: { Icon: Flame,     accentVar: "hsl(var(--agent-critic))",     tint: "from-agent-critic/20" },
  pm:      { Icon: GitBranch, accentVar: "hsl(var(--agent-coordinator))",tint: "from-agent-coordinator/20" },
  student: { Icon: UserX,     accentVar: "hsl(var(--agent-router))",     tint: "from-agent-router/20" },
  admin:   { Icon: Shield,    accentVar: "hsl(var(--agent-memory))",     tint: "from-agent-memory/20" },
};

export function HeroSection() {
  const { loginAs, loadingSlug } = useDemoLogin();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <ParticleGraph />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background pointer-events-none" />

      <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="inline-block px-4 py-1.5 mb-6 text-xs font-medium tracking-widest uppercase rounded-full border border-primary/30 bg-primary/10 text-primary">
            Second Brain · AI Chief of Staff · USAII Brief 3
          </span>
        </motion.div>

        <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-bold font-display tracking-tight mb-6" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
          Build the{" "}<span className="gradient-text">Second Brain</span>{" "}for Real Life
        </motion.h1>

        <motion.div className="h-8 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }}>
          <AnimatedSubtitles items={subtitles} />
        </motion.div>

        <motion.div className="flex flex-col items-center gap-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.45 }}>
          <Button asChild size="lg" className="text-base px-8 py-6 rounded-xl bg-primary hover:bg-primary/90 shadow-lg">
            <Link to="/auth">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>

          <div className="w-full max-w-5xl">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 flex items-center justify-center gap-2">
              <Sparkles className="h-3 w-3" /> Try a demo organization
            </p>
            <div
              id="personas"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4"
            >
              {DEMO_PERSONAS.map((p, i) => {
                const meta = PERSONA_META[p.slug] ?? PERSONA_META.apple;
                const isLoading = loadingSlug === p.slug;
                const disabled = loadingSlug !== null;
                return (
                  <motion.button
                    key={p.slug}
                    type="button"
                    onClick={() => loginAs(p)}
                    disabled={disabled}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 * i }}
                    whileHover={!disabled ? { y: -4 } : undefined}
                    whileTap={!disabled ? { scale: 0.97 } : undefined}
                    style={{ ["--accent" as any]: meta.accentVar }}
                    className={[
                      "group relative overflow-hidden text-left",
                      "rounded-2xl p-4 sm:p-5",
                      "bg-card/50 backdrop-blur-md",
                      "border border-border/60",
                      "shadow-[0_1px_0_0_hsl(var(--border))]",
                      "transition-all duration-300",
                      "hover:border-[color:var(--accent)] hover:bg-card/70",
                      "hover:shadow-[0_8px_30px_-12px_var(--accent)]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
                      "cursor-pointer",
                    ].join(" ")}
                  >
                    {/* accent glow */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
                      style={{ background: "var(--accent)" }}
                    />
                    {/* top accent bar */}
                    <span
                      aria-hidden
                      className="absolute inset-x-0 top-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
                      style={{ background: "var(--accent)" }}
                    />

                    <div className="relative flex flex-col gap-3 min-h-[112px]">
                      <div className="flex items-center justify-between">
                        <span
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background/40 transition-colors group-hover:border-[color:var(--accent)]"
                          style={{ color: "var(--accent)" }}
                        >
                          <meta.Icon className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <ArrowRight
                          className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[color:var(--accent)]"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                          {p.label}
                        </span>
                        <span className="block text-sm font-semibold leading-snug text-foreground">
                          {isLoading ? (
                            <span className="inline-flex items-center gap-2">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
                            </span>
                          ) : (
                            <>Enter as {p.org}</>
                          )}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-3">
              Mock data is auto-seeded on first click — Neo4j, Pinecone &amp; voice notifications included.
            </p>
          </div>
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

import { motion } from "framer-motion";
import { Flame, UserX, GitBranch, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_PERSONAS } from "@/lib/demo-personas";
import { useDemoLogin } from "@/hooks/use-demo-login";

const personas: { icon: any; title: string; problem: string; solution: string; color: string; slug: string }[] = [
  {
    icon: Flame,
    title: "The Overwhelmed Founder",
    problem: "150+ Slack channels, hundreds of emails, and no idea what actually matters.",
    solution: "AI surfaces the 5 things that need your attention right now — with full context and recommended actions.",
    color: "border-agent-critic/30 hover:border-agent-critic/60",
    slug: "founder",
  },
  {
    icon: UserX,
    title: "The Left-Out IC",
    problem: "Key decisions made in meetings you weren't in. You find out days later, or not at all.",
    solution: "Router Agent detects knowledge gaps and sends you a targeted briefing with exactly what changed and why it matters to you.",
    color: "border-agent-router/30 hover:border-agent-router/60",
    slug: "student",
  },
  {
    icon: GitBranch,
    title: "The Cross-Team PM",
    problem: "Engineering says one thing, Product says another. Dependencies are invisible until they break.",
    solution: "Knowledge graph reveals hidden dependencies and Critic Agent flags conflicting decisions before they cause damage.",
    color: "border-agent-coordinator/30 hover:border-agent-coordinator/60",
    slug: "pm",
  },
];

export function PersonaCards() {
  const { loginAs, loadingSlug } = useDemoLogin();
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
            Built for real problems
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Every feature is designed around the pain points we've seen in fast-moving organizations.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {personas.map((persona, i) => {
            const demo = DEMO_PERSONAS.find((d) => d.slug === persona.slug);
            const loading = demo && loadingSlug === demo.slug;
            return (
            <motion.div
              key={persona.title}
              className={`glass-panel p-8 border-l-2 ${persona.color} transition-colors duration-300 flex flex-col`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <persona.icon className="h-8 w-8 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold font-display mb-3">{persona.title}</h3>
              <p className="text-sm text-destructive/80 mb-4 italic">"{persona.problem}"</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">{persona.solution}</p>
              {demo && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loginAs(demo)}
                  disabled={loadingSlug !== null}
                  className="w-full"
                >
                  {loading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <ArrowRight className="h-3 w-3 mr-2" />}
                  Enter as {demo.org}
                </Button>
              )}
            </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

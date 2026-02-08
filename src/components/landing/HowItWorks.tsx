import { motion } from "framer-motion";
import { Download, BarChart3, Eye, Zap } from "lucide-react";

const steps = [
  {
    icon: Download,
    title: "Ingest",
    description: "Slack messages, emails, meeting transcripts, and calendar events flow into the system automatically.",
  },
  {
    icon: BarChart3,
    title: "Analyze",
    description: "AI agents extract entities, detect conflicts, score stakeholder relevance, and version-stamp decisions.",
  },
  {
    icon: Eye,
    title: "Visualize",
    description: "A 3D knowledge graph reveals connections, information flow, and gaps across your organization.",
  },
  {
    icon: Zap,
    title: "Act",
    description: "Route knowledge to the right people, resolve conflicts, and draft communications — all AI-powered.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
            How it works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From raw communication to actionable organizational intelligence in four steps.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0" />

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              className="relative text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-5 relative z-10">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary/40 -mt-3">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="text-lg font-semibold font-display mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

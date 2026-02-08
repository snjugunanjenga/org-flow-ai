import { motion } from "framer-motion";
import { Network, Brain, Mic } from "lucide-react";

const propositions = [
  {
    icon: Network,
    title: "Knowledge Graph",
    description:
      "Interactive 3D visualization of your entire organizational knowledge — people, decisions, topics, and projects, all connected.",
    color: "text-graph-topic",
  },
  {
    icon: Brain,
    title: "Multi-Agent Intelligence",
    description:
      "Four specialized AI agents extract, route, critique, and coordinate organizational knowledge in real-time.",
    color: "text-agent-coordinator",
  },
  {
    icon: Mic,
    title: "Voice Interaction",
    description:
      "Full-duplex voice commands to query your knowledge graph, get briefings, and draft communications hands-free.",
    color: "text-agent-memory",
  },
];

export function ValuePropositions() {
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
            Intelligence at every layer
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From data ingestion to actionable insights — a complete AI stack for organizational clarity.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {propositions.map((prop, i) => (
            <motion.div
              key={prop.title}
              className="glass-panel p-8 glow-border group hover:scale-[1.02] transition-transform duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <div className={`inline-flex p-3 rounded-xl bg-secondary mb-5 ${prop.color}`}>
                <prop.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold font-display mb-3">
                {prop.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {prop.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

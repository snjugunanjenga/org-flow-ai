import { motion } from "framer-motion";

const techStack = [
  "React", "Vite", "TypeScript", "Tailwind", "Three.js",
  "Neo4j", "Pinecone", "Supabase", "OpenAI", "Playwright",
];

export function Footer() {
  return (
    <footer className="py-16 px-6 border-t border-border/50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-xl font-display font-semibold mb-2 gradient-text inline-block">
            Version control for organizational truth
          </h3>
          <p className="text-sm text-muted-foreground">
            The moonshot: every decision tracked, every contradiction resolved, every stakeholder informed.
          </p>
        </motion.div>

        <motion.div
          className="flex flex-wrap justify-center gap-3 mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {techStack.map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 text-xs font-medium rounded-full border border-border/50 bg-secondary/50 text-muted-foreground"
            >
              {tech}
            </span>
          ))}
        </motion.div>

        <div className="text-center text-xs text-muted-foreground/60">
          <p>Superhuman AI Chief of Staff — Built for the AI Hackathon</p>
        </div>
      </div>
    </footer>
  );
}

// Demo persona credentials — must match supabase/functions/seed-personas/index.ts
// and seed-super-admin/index.ts. Surfaced to judges via the hero switcher.
export type DemoPersona = {
  slug: string;
  label: string;
  org: string;
  email: string;
  password: string;
  description: string;
  accent: string; // tailwind class
  seedFn: "seed-personas" | "seed-super-admin";
};

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    slug: "apple",
    label: "Apple — Steve Jobs",
    org: "Apple",
    email: "steve.jobs@apple.com",
    password: "Demo!2026",
    description: "Enterprise · Product launches, design reviews, full knowledge graph.",
    accent: "border-primary/40 hover:border-primary",
    seedFn: "seed-personas",
  },
  {
    slug: "founder",
    label: "Overwhelmed Founder",
    org: "Lumen Robotics",
    email: "founder.demo@chiefofstaff.app",
    password: "Demo!2026",
    description: "Enterprise plan · 4 teams · FCC risk + Series B in flight.",
    accent: "border-agent-critic/40 hover:border-agent-critic",
    seedFn: "seed-personas",
  },
  {
    slug: "pm",
    label: "Cross-Team PM",
    org: "Northwind Product",
    email: "pm.demo@chiefofstaff.app",
    password: "Demo!2026",
    description: "Pro plan · Eng/Design/GTM conflicts to resolve.",
    accent: "border-agent-coordinator/40 hover:border-agent-coordinator",
    seedFn: "seed-personas",
  },
  {
    slug: "student",
    label: "The Left-Out IC",
    org: "Stanford CS Cohort",
    email: "student.demo@chiefofstaff.app",
    password: "Demo!2026",
    description: "Free plan · Notebook-style research workspace.",
    accent: "border-agent-router/40 hover:border-agent-router",
    seedFn: "seed-personas",
  },
];
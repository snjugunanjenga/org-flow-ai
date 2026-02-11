import { motion } from "framer-motion";
import { Check, Sparkles, Building2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/ month",
    description: "For small teams getting started with AI-powered coordination.",
    icon: Rocket,
    features: [
      "Up to 5 team members",
      "Basic knowledge graph",
      "10 AI queries / day",
      "1 project workspace",
      "Community support",
      "1 month free trial of Pro features",
    ],
    cta: "Start Free Trial",
    highlight: false,
    badge: null,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/ user / month",
    description: "For growing organizations that need full AI intelligence.",
    icon: Sparkles,
    features: [
      "Unlimited team members",
      "Advanced knowledge graph + mind map",
      "Unlimited AI queries",
      "Unlimited projects & notebooks",
      "Google Calendar & Meet integration",
      "Conflict detection & resolution",
      "Custom report generation",
      "Priority support",
      "1 month free trial",
    ],
    cta: "Start Free Trial",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations with advanced security & compliance needs.",
    icon: Building2,
    features: [
      "Everything in Pro",
      "SSO & SAML authentication",
      "Custom AI model training",
      "Dedicated Neo4j instance",
      "Advanced analytics & oversight",
      "Custom integrations (Slack, Jira, etc.)",
      "SLA & dedicated support",
      "On-premise deployment option",
      "1 month free trial",
    ],
    cta: "Contact Sales",
    highlight: false,
    badge: null,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Every plan includes a free 30-day trial. No credit card required to start.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={`relative glass-panel p-8 flex flex-col ${
                plan.highlight
                  ? "glow-border ring-1 ring-primary/30 scale-[1.02]"
                  : ""
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                  {plan.badge}
                </span>
              )}

              <div className="mb-6">
                <div className="inline-flex p-3 rounded-xl bg-secondary mb-4">
                  <plan.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-display">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold font-display">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                variant={plan.highlight ? "default" : "outline"}
                className="w-full"
              >
                <Link to="/auth">{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

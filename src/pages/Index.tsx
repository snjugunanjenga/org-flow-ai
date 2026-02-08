import { HeroSection } from "@/components/landing/HeroSection";
import { ValuePropositions } from "@/components/landing/ValuePropositions";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PersonaCards } from "@/components/landing/PersonaCards";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <ValuePropositions />
      <HowItWorks />
      <PersonaCards />
      <Footer />
    </main>
  );
};

export default Index;

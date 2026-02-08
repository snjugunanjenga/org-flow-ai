import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { ValuePropositions } from "@/components/landing/ValuePropositions";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PersonaCards } from "@/components/landing/PersonaCards";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <section id="features"><ValuePropositions /></section>
      <section id="how-it-works"><HowItWorks /></section>
      <section id="personas"><PersonaCards /></section>
      <Footer />
    </main>
  );
};

export default Index;

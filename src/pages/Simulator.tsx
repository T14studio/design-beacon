import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FinancingSimulator from "@/components/FinancingSimulator";
import MarketIndicators from "@/components/MarketIndicators";
import ScrollReveal from "@/components/ScrollReveal";
import BackButton from "@/components/BackButton";

export default function Simulator() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-12 px-6">
        <div className="container mx-auto">
          <div className="mb-6">
            <BackButton />
          </div>
          <span className="font-mono text-xs tracking-widest uppercase text-primary mb-2 block">
            Ferramentas
          </span>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            Simulador & Indicadores
          </h1>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="container mx-auto">
          <ScrollReveal>
            <MarketIndicators />
          </ScrollReveal>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="container mx-auto">
          <ScrollReveal delay={150}>
            <FinancingSimulator />
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}

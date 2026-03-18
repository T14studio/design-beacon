import { useEffect, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, MapPin } from "lucide-react";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import { properties } from "@/data/properties";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Marquee from "@/components/Marquee";
import PropertyCard from "@/components/PropertyCard";
import ScrollReveal from "@/components/ScrollReveal";
import MarketIndicators from "@/components/MarketIndicators";
import { Button } from "@/components/ui/button";

const PropertyMap = lazy(() => import("@/components/PropertyMap"));

const heroImages = [hero1, hero2, hero3];
const kenburnsClasses = ["animate-kenburns-1", "animate-kenburns-2", "animate-kenburns-3"];

const stats = [
  { value: "120+", label: "Imóveis disponíveis" },
  { value: "15", label: "Anos de experiência" },
  { value: "800+", label: "Clientes satisfeitos" },
];

export default function Index() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((p) => (p + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const featured = properties.filter((p) => p.featured);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative h-screen overflow-hidden">
        {heroImages.map((img, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-[1.5s] ease-in-out ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={img}
              alt=""
              className={`w-full h-full object-cover ${kenburnsClasses[i]}`}
            />
          </div>
        ))}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-end pb-24 px-6">
          <div className="container mx-auto">
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="bg-primary/20 border border-primary/40 text-primary text-xs font-mono tracking-widest uppercase px-4 py-1.5 rounded-full">
                Venda
              </span>
              <span className="bg-primary/20 border border-primary/40 text-primary text-xs font-mono tracking-widest uppercase px-4 py-1.5 rounded-full">
                Locação
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6 max-w-3xl">
              <span className="text-gold-gradient">Imóveis</span>{" "}
              <span className="text-foreground">de Alto Padrão</span>
            </h1>

            <p className="text-muted-foreground text-lg md:text-xl max-w-xl mb-10 font-light">
              Encontre residências exclusivas com a curadoria da Ética Áxis Imobiliária.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-gold-gradient text-primary-foreground font-semibold tracking-wide hover:opacity-90 transition-opacity">
                <Link to="/imoveis">
                  Ver imóveis <ArrowRight size={18} />
                </Link>
              </Button>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/50">
            <span className="text-[10px] font-mono tracking-widest uppercase">Scroll</span>
            <ArrowDown size={16} className="animate-bounce" />
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col gap-8 z-10">
          {stats.map((s, i) => (
            <div
              key={i}
              className="group text-right cursor-default"
            >
              <p className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                {s.value}
              </p>
              <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Marquee ── */}
      <Marquee />

      {/* ── Market Indicators ── */}
      <section className="py-8 px-6">
        <div className="container mx-auto">
          <ScrollReveal>
            <MarketIndicators />
          </ScrollReveal>
        </div>
      </section>

      {/* ── Featured ── */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="flex items-end justify-between mb-16">
              <div>
                <span className="font-mono text-xs tracking-widest uppercase text-primary mb-2 block">
                  Destaques
                </span>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Imóveis selecionados
                </h2>
              </div>
              <Link
                to="/imoveis"
                className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                Ver todos <ArrowRight size={16} />
              </Link>
            </div>
          </ScrollReveal>

          <div className="space-y-8">
            {featured.map((p, i) => (
              <ScrollReveal key={p.id} delay={i * 150}>
                <PropertyCard property={p} variant="featured" />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Teaser ── */}
      <section className="py-24 px-6 bg-card border-y border-border">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
              <div className="md:col-span-4">
                <span className="font-mono text-xs tracking-widest uppercase text-primary block mb-4">
                  Nossos valores
                </span>
                <ul className="space-y-3">
                  {["Ética", "Transparência", "Excelência", "Confiança"].map((v) => (
                    <li key={v} className="flex items-center gap-3 text-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-sm font-medium tracking-wide">{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:col-span-8">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6 leading-snug">
                  Há mais de 15 anos conectando pessoas aos{" "}
                  <span className="text-gold-gradient">imóveis dos seus sonhos</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed max-w-2xl">
                  A Ética Áxis Imobiliária é referência no mercado de imóveis de alto padrão em São Paulo. 
                  Nossa curadoria exclusiva garante que cada propriedade atenda aos mais exigentes padrões 
                  de qualidade, localização e sofisticação.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-6">
        <div className="container mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-8 max-w-2xl mx-auto leading-tight">
              Encontre o imóvel dos seus{" "}
              <span className="text-gold-gradient">sonhos</span>
            </h2>
            <Button asChild size="lg" className="bg-gold-gradient text-primary-foreground font-semibold tracking-wide hover:opacity-90 transition-opacity">
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                Fale conosco pelo WhatsApp
              </a>
            </Button>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}

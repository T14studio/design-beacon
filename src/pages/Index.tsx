import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, Star, TrendingUp, Home, Send } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const WHATSAPP = "5567996241515";
const heroImages = [hero1, hero2, hero3];
const kenburnsClasses = ["animate-kenburns-1", "animate-kenburns-2", "animate-kenburns-3"];

const stats = [
  { value: "120+", label: "Imóveis disponíveis" },
  { value: "15", label: "Anos de experiência" },
  { value: "800+", label: "Clientes satisfeitos" },
];

const testimonials = [
  {
    name: "Fernanda Oliveira",
    role: "Compradora — Campo Grande, MS",
    text: "Atendimento impecável do início ao fim. A equipe da Ética Áxis entendeu exatamente o que eu buscava e encontrou o imóvel perfeito.",
    stars: 5,
  },
  {
    name: "Ricardo Santos",
    role: "Investidor — Campo Grande, MS",
    text: "Profissionalismo e transparência. Já adquiri três imóveis com a Ética Áxis e a confiança só aumenta a cada negociação.",
    stars: 5,
  },
  {
    name: "Mariana Costa",
    role: "Proprietária — Jardim Seminário",
    text: "Venderam meu apartamento em menos de 30 dias pelo valor que eu esperava. Recomendo sem hesitar.",
    stars: 5,
  },
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
      <section className="relative h-[100svh] overflow-hidden">
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
        <div className="relative z-10 h-full flex flex-col justify-end pb-16 md:pb-24 px-4 md:px-6">
          <div className="container mx-auto">
            <div className="flex flex-wrap gap-2 md:gap-3 mb-4 md:mb-6">
              <span className="bg-primary/20 border border-primary/40 text-primary text-[10px] md:text-xs font-mono tracking-widest uppercase px-3 md:px-4 py-1 md:py-1.5 rounded-full">
                Venda
              </span>
              <span className="bg-primary/20 border border-primary/40 text-primary text-[10px] md:text-xs font-mono tracking-widest uppercase px-3 md:px-4 py-1 md:py-1.5 rounded-full">
                Locação
              </span>
            </div>

            <h1 className="text-3xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-4 md:mb-6 max-w-3xl">
              <span className="text-gold-gradient">O melhor imóvel</span>{" "}
              <span className="text-foreground drop-shadow-lg">com quem entende disso</span>
            </h1>

            <p className="text-foreground/80 text-base md:text-xl max-w-xl mb-8 md:mb-10 font-light drop-shadow-sm">
              Quando trabalhamos coletivamente em prol de um objetivo, conquistamos o impossível.
            </p>

            <div className="flex flex-wrap gap-3 md:gap-4">
              <Button asChild size="lg" className="bg-gold-gradient text-primary-foreground font-semibold tracking-wide hover:opacity-90 transition-opacity text-sm md:text-base">
                <Link to="/imoveis">
                  Ver imóveis <ArrowRight size={18} />
                </Link>
              </Button>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/50">
            <span className="text-[10px] font-mono tracking-widest uppercase">Scroll</span>
            <ArrowDown size={16} className="animate-bounce" />
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col gap-8 z-10">
          {stats.map((s, i) => (
            <div key={i} className="group text-right cursor-default">
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
      <section className="py-6 md:py-8 px-4 md:px-6">
        <div className="container mx-auto">
          <ScrollReveal>
            <MarketIndicators />
          </ScrollReveal>
        </div>
      </section>

      {/* ── Featured ── */}
      <section className="py-16 md:py-24 px-4 md:px-6">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 md:mb-16">
              <div>
                <span className="font-mono text-xs tracking-widest uppercase text-primary mb-2 block">
                  Destaques
                </span>
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
                  Imóveis selecionados
                </h2>
              </div>
              <Link
                to="/imoveis"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                Ver todos <ArrowRight size={16} />
              </Link>
            </div>
          </ScrollReveal>

          <div className="space-y-6 md:space-y-8">
            {featured.map((p, i) => (
              <ScrollReveal key={p.id} delay={i * 150}>
                <PropertyCard property={p} variant="featured" />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Prova Social — Depoimentos ── */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-card border-y border-border">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="text-center mb-10 md:mb-16">
              <span className="font-mono text-xs tracking-widest uppercase text-primary mb-2 block">
                Depoimentos
              </span>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
                O que nossos clientes <span className="text-gold-gradient">dizem</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((t, i) => (
              <ScrollReveal key={i} delay={i * 150}>
                <div className="bg-background border border-border rounded-lg p-6 md:p-8 h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} size={16} className="fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-foreground/90 leading-relaxed mb-6 flex-1 italic text-sm md:text-base">
                    "{t.text}"
                  </p>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Investidores ── */}
      <section className="py-16 md:py-24 px-4 md:px-6">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="text-center mb-10 md:mb-16">
              <span className="font-mono text-xs tracking-widest uppercase text-primary mb-2 block">
                Investidores
              </span>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
                Oportunidades de <span className="text-gold-gradient">investimento</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: TrendingUp,
                title: "Valorização garantida",
                desc: "Imóveis em regiões com alto potencial de valorização, selecionados por especialistas com mais de 15 anos de mercado.",
              },
              {
                icon: Home,
                title: "Lançamentos exclusivos",
                desc: "Acesso antecipado a lançamentos de construtoras parceiras em condições especiais para investidores.",
              },
              {
                icon: Star,
                title: "Renda passiva",
                desc: "Imóveis para locação com alta demanda e retorno consistente. Assessoria completa na gestão do seu patrimônio.",
              },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 150}>
                <div className="border border-border rounded-lg p-6 md:p-8 hover:border-primary/30 transition-colors duration-500 h-full">
                  <item.icon size={28} className="text-primary mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={300}>
            <div className="text-center mt-10 md:mt-12">
              <Button asChild variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
                <a href={`https://wa.me/${WHATSAPP}?text=Olá! Gostaria de saber mais sobre oportunidades de investimento.`} target="_blank" rel="noopener noreferrer">
                  Falar com especialista em investimentos
                </a>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Proprietário — Venda/Alugue seu imóvel ── */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-card border-y border-border">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <ScrollReveal>
              <span className="font-mono text-xs tracking-widest uppercase text-primary mb-2 block">
                Proprietários
              </span>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4 md:mb-6">
                Quer <span className="text-gold-gradient">vender ou alugar</span> seu imóvel?
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6 md:mb-8 max-w-lg text-sm md:text-base">
                Conte com a experiência da Ética Áxis para valorizar e comercializar seu imóvel com segurança e agilidade. Avaliação gratuita e sem compromisso.
              </p>
              <ul className="space-y-3 mb-6 md:mb-8">
                {[
                  "Avaliação gratuita do seu imóvel",
                  "Fotos profissionais e tour virtual",
                  "Divulgação nos principais portais",
                  "Assessoria jurídica completa",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-foreground text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="bg-background border border-border rounded-lg p-6 md:p-8">
                <h3 className="text-lg font-semibold text-foreground mb-2">Solicite sua avaliação gratuita</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Preencha o formulário e entraremos em contato em até 24h.
                </p>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <Input placeholder="Seu nome" className="bg-card" />
                  <Input type="email" placeholder="E-mail" className="bg-card" />
                  <Input type="tel" placeholder="Telefone" className="bg-card" />
                  <Input placeholder="Endereço do imóvel" className="bg-card" />
                  <Textarea placeholder="Detalhes adicionais (tipo, área, etc.)" rows={3} className="bg-card" />
                  <Button className="w-full bg-gold-gradient text-primary-foreground font-semibold tracking-wide hover:opacity-90 transition-opacity active:scale-[0.97]">
                    <Send size={16} />
                    Solicitar avaliação
                  </Button>
                </form>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Diretora Executiva ── */}
      <section className="py-16 md:py-24 px-4 md:px-6">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
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
                <h2 className="text-xl md:text-3xl font-bold tracking-tight mb-4 md:mb-6 leading-snug">
                  Há mais de 15 anos conectando pessoas aos{" "}
                  <span className="text-gold-gradient">imóveis dos seus sonhos</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed max-w-2xl text-sm md:text-base">
                  A Ética Áxis Imobiliária é referência no mercado imobiliário em Campo Grande — MS. 
                  Sob a direção executiva de Ysla Barros Saad, nossa curadoria exclusiva garante que cada 
                  propriedade atenda aos mais exigentes padrões de qualidade, localização e sofisticação.
                  Quando trabalhamos coletivamente em prol de um objetivo, conquistamos o impossível.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 md:py-32 px-4 md:px-6">
        <div className="container mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-2xl md:text-5xl font-bold tracking-tight mb-6 md:mb-8 max-w-2xl mx-auto leading-tight">
              Encontre o imóvel dos seus{" "}
              <span className="text-gold-gradient">sonhos</span>
            </h2>
            <Button asChild size="lg" className="bg-gold-gradient text-primary-foreground font-semibold tracking-wide hover:opacity-90 transition-opacity active:scale-[0.97]">
              <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">
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

import { useEffect, useState, useRef, useMemo, lazy, Suspense, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, Star, TrendingUp, Home, Send, MapPin, Calculator, ChevronLeft, ChevronRight, Check } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
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

const PropertyMap = lazy(() => import("@/components/PropertyMap"));

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
    role: "Compradora — Jardins, SP",
    text: "Atendimento impecável do início ao fim. A equipe da Ética Áxis entendeu exatamente o que eu buscava e encontrou a cobertura perfeita.",
    stars: 5,
  },
  {
    name: "Ricardo Santos",
    role: "Investidor — Alphaville",
    text: "Profissionalismo e transparência. Já adquiri três imóveis com a Ética Áxis e a confiança só aumenta a cada negociação.",
    stars: 5,
  },
  {
    name: "Mariana Costa",
    role: "Proprietária — Vila Nova Conceição",
    text: "Venderam meu apartamento em menos de 30 dias pelo valor que eu esperava. Recomendo sem hesitar.",
    stars: 5,
  },
  {
    name: "Guilherme Arantes",
    role: "Comprador — Porto Feliz",
    text: "Buscava um refúgio no interior e a Ética Áxis foi fundamental para encontrar o lote ideal com vista para o golfe. Experiência de alto nível.",
    stars: 5,
  },
  {
    name: "Beatriz Lins",
    role: "Locatária — Itaim Bibi",
    text: "Processo de locação ágil e sem burocracias desnecessárias. O imóvel estava impecável, exatamente como nas fotos.",
    stars: 5,
  },
];

import { supabaseClient } from "@/lib/supabase";

export default function Index() {
  const [current, setCurrent] = useState(0);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    details: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabaseClient.from('leads').insert([
        {
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          message: `Localização: ${formData.location} | Detalhes: ${formData.details}`
        }
      ]);

      if (error) {
        console.group("Erro Supabase Detalhado");
        console.error("Mensagem:", error.message);
        console.error("Detalhes:", error.details);
        console.error("Código:", error.code);
        console.error("Sugestão:", error.hint);
        
        if (error.code === '42501' || error.message?.includes('row-level security')) {
          console.warn("Dica: Isso parece ser um erro de RLS (Row-Level Security). Verifique as policies da tabela 'leads'.");
        }
        console.groupEnd();
        
        throw error;
      } else {
        alert("Mensagem enviada com sucesso!");
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          location: "",
          details: ""
        });
      }
    } catch (err: any) {
      console.error("Erro completo capturado:", err);
      const errorMessage = err.message || "Ocorreu um erro ao enviar sua solicitação.";
      alert(`${errorMessage}\n\nVerifique o console para mais detalhes técnicos.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((p) => (p + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const scrollToNext = () => {
    marqueeRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const featured = properties.filter((p) => p.featured);

  return (
    <div className="min-h-screen-safe bg-background overflow-x-hidden">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative h-screen-safe overflow-hidden">
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
        <div className="relative z-10 h-full flex flex-col justify-end pb-24 sm:pb-28 md:pb-32 px-4 sm:px-6">
          <div className="container mx-auto">
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
              <span className="bg-primary/20 border border-primary/40 text-primary text-[9px] sm:text-[10px] font-mono tracking-[0.2em] uppercase px-4 sm:px-6 py-1.5 sm:py-2 rounded-full backdrop-blur-sm">
                Venda
              </span>
              <span className="bg-primary/20 border border-primary/40 text-primary text-[9px] sm:text-[10px] font-mono tracking-[0.2em] uppercase px-4 sm:px-6 py-1.5 sm:py-2 rounded-full backdrop-blur-sm">
                Locação
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-bold tracking-tight leading-[1.1] sm:leading-[1.0] mb-5 sm:mb-8 max-w-4xl break-words">
              <span className="text-gold-gradient">Residências</span>{" "}
              <span className="text-foreground drop-shadow-2xl">que Inspiram</span>
            </h1>

            <p className="text-foreground/80 text-base sm:text-lg md:text-2xl max-w-2xl mb-8 sm:mb-12 font-light drop-shadow-sm leading-relaxed">
              Descubra imóveis exclusivos com a curadoria especializada da Ética Áxis. Transformamos o conceito de morar em uma experiência extraordinária.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <Button asChild className="bg-gold-gradient text-primary-foreground font-bold tracking-widest uppercase hover:opacity-90 transition-all h-12 sm:h-14 md:h-16 px-6 sm:px-10 shadow-2xl btn-shine rounded-full group text-[10px] sm:text-sm w-full sm:w-auto flex items-center justify-center">
                <Link to="/imoveis" className="flex items-center justify-center gap-2 sm:gap-3 w-full">
                  Explorar portfólio <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Scroll indicator */}
          <button 
            onClick={scrollToNext}
            className="absolute bottom-6 sm:bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 sm:gap-4 text-muted-foreground/30 hover:text-primary transition-all duration-500 scale-90 hover:scale-100"
          >
            <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.3em] sm:tracking-[0.4em] uppercase ml-[0.3em] sm:ml-[0.4em]">Descubra mais</span>
            <div className="w-[1px] h-8 sm:h-12 bg-gradient-to-b from-primary/50 to-transparent animate-pulse" />
          </button>
        </div>
      </section>

      {/* ── Marquee ── */}
      <div ref={marqueeRef}>
        <Marquee />
      </div>

      {/* ── Featured (Imóveis) ── */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-14 md:mb-20 border-b border-border/50 pb-8 sm:pb-12 gap-4 sm:gap-0">
              <div>
                <span className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-3 sm:mb-4 block font-bold">
                  Curadoria Exclusiva
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight">
                  Imóveis em <span className="text-gold-gradient">destaque</span>
                </h2>
              </div>
              <Link
                to="/imoveis"
                className="hidden md:flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-all group"
              >
                Ver portfólio completo <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </ScrollReveal>

          <div className="space-y-8 sm:space-y-12">
            {featured.map((p, i) => (
              <ScrollReveal key={p.id} delay={i * 200}>
                <PropertyCard property={p} variant="featured" />
              </ScrollReveal>
            ))}
          </div>

          <div className="mt-10 sm:mt-16 text-center md:hidden">
             <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 rounded-full w-full h-12 sm:h-14 font-bold tracking-widest uppercase text-[10px]">
                <Link to="/imoveis" className="flex items-center justify-center w-full">Ver todos os imóveis</Link>
             </Button>
          </div>
        </div>
      </section>

      {/* ── Mapa Teaser ── */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 bg-card/10">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 lg:gap-20 items-center">
            <ScrollReveal>
              <span className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-3 sm:mb-4 block font-bold">Localização</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-5 sm:mb-8 leading-tight">
                Onde a sofisticação <br className="hidden sm:block" />encontra a <span className="text-gold-gradient">região ideal</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8 sm:mb-10 text-base sm:text-lg max-w-lg font-light">
                Navegue pelas localizações mais nobres e encontre o imóvel ideal no bairro que combina com suas conquistas.
              </p>
              <Button asChild variant="outline" className="border-primary/40 w-full sm:w-auto text-primary hover:bg-primary/10 h-12 sm:h-14 md:h-16 px-6 sm:px-8 md:px-10 rounded-full font-bold tracking-widest uppercase text-[10px] sm:text-[11px] group flex justify-center items-center">
                <Link to="/imoveis" className="flex items-center justify-center gap-2 w-full">
                  <MapPin size={18} className="group-hover:scale-110 transition-transform" />
                  Explorar no mapa
                </Link>
              </Button>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <div className="h-[300px] sm:h-[380px] md:h-[450px] bg-background border border-border/50 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
                <Suspense fallback={<div className="w-full h-full bg-card animate-pulse" />}>
                  <div className="absolute inset-0 grayscale opacity-60 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-1000 pointer-events-none">
                    <PropertyMap properties={featured} className="h-full border-none" />
                  </div>
                </Suspense>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40 opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-10 md:p-12">
                   <div className="text-center p-6 sm:p-8 md:p-10 backdrop-blur-xl bg-background/30 border border-white/5 rounded-2xl sm:rounded-[1.5rem] md:rounded-[2rem] shadow-2xl group-hover:scale-105 transition-transform duration-700 pointer-events-none">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-primary/20">
                         <MapPin size={24} className="text-primary animate-pulse sm:hidden" />
                         <MapPin size={32} className="text-primary animate-pulse hidden sm:block" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 tracking-tight">Geolocalização Ativa</h3>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-[0.2em] sm:tracking-[0.3em] font-mono leading-relaxed font-bold">
                        Visualização exclusiva dos <br/>principais empreendimentos
                      </p>
                   </div>
                </div>
                <Link to="/imoveis" className="absolute inset-0 z-20" aria-label="Ver no mapa" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Simulador Section ── */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl sm:rounded-[2rem] md:rounded-[3rem] p-6 sm:p-10 md:p-14 lg:p-20 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-6 sm:p-12 opacity-5 scale-100 sm:scale-125 md:scale-150 rotate-12 group-hover:scale-[1.1] sm:group-hover:scale-[1.4] md:group-hover:scale-[1.75] transition-transform duration-1000 text-primary">
                <Calculator size={200} className="sm:hidden" />
                <Calculator size={300} className="hidden sm:block" />
              </div>
              <div className="relative z-10 max-w-2xl">
                <div className="w-12 sm:w-16 h-1 bg-primary/30 mb-6 sm:mb-8 rounded-full" />
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-5 sm:mb-8 leading-tight">
                  Planeje sua <br/>próxima conquista
                </h2>
                <p className="text-muted-foreground text-base sm:text-lg md:text-xl mb-8 sm:mb-12 leading-relaxed font-light">
                  Utilize nossa ferramenta especializada de simulação financeira para descobrir as melhores condições para o seu investimento imobiliário.
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-5">
                  <Button asChild className="bg-gold-gradient text-primary-foreground font-bold px-6 sm:px-10 h-12 sm:h-14 md:h-16 rounded-full hover:opacity-90 transition-all shadow-xl btn-shine uppercase tracking-widest text-[10px] sm:text-[11px] w-full sm:w-auto flex items-center justify-center">
                    <Link to="/simulador" className="w-full flex justify-center items-center">Simular Agora</Link>
                  </Button>
                  <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 px-6 sm:px-10 h-12 sm:h-14 md:h-16 rounded-full font-bold tracking-widest uppercase text-[10px] sm:text-[11px] w-full sm:w-auto flex justify-center items-center">
                    <a href="https://wa.me/5567991193513?text=Olá! Gostaria de falar com um especialista sobre simulação de financiamento." target="_blank" rel="noopener noreferrer" className="w-full flex justify-center items-center text-center">
                      Falar com especialista
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Prova Social — Depoimentos ── */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 border-y border-border overflow-hidden bg-card/5">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-14 md:mb-20 gap-6 sm:gap-8">
              <div className="max-w-xl">
                <span className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-3 sm:mb-4 block font-bold">
                  Relatos de Confiança
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                  O que nossos clientes <br className="hidden sm:block" /><span className="text-gold-gradient">experimentam</span>
                </h2>
              </div>
              <div className="flex gap-3 sm:gap-4">
                <button 
                  onClick={scrollPrev}
                  className="w-11 h-11 sm:w-14 sm:h-14 rounded-full border border-border hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-all group active:scale-95"
                  aria-label="Anterior"
                >
                  <ChevronLeft size={20} className="sm:hidden" />
                  <ChevronLeft size={24} className="hidden sm:block" />
                </button>
                <button 
                  onClick={scrollNext}
                  className="w-11 h-11 sm:w-14 sm:h-14 rounded-full border border-border hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-all group active:scale-95"
                  aria-label="Próximo"
                >
                  <ChevronRight size={20} className="sm:hidden" />
                  <ChevronRight size={24} className="hidden sm:block" />
                </button>
              </div>
            </div>
          </ScrollReveal>

          <div className="embla overflow-hidden -mx-1 sm:mx-0" ref={emblaRef}>
            <div className="embla__container flex">
              {testimonials.map((t, i) => (
                <div key={i} className="embla__slide flex-[0_0_100%] sm:flex-[0_0_85%] md:flex-[0_0_450px] px-2 sm:px-4">
                  <div className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] p-6 sm:p-8 md:p-10 h-full flex flex-col shadow-sm hover:shadow-2xl hover:border-primary/20 hover:bg-card/60 transition-all duration-700 group">
                    <div className="flex gap-1 mb-6 sm:mb-10">
                      {Array.from({ length: t.stars }).map((_, j) => (
                        <Star key={j} size={14} className="fill-primary text-primary group-hover:scale-110 transition-transform sm:w-4 sm:h-4" style={{ transitionDelay: `${j * 50}ms` }} />
                      ))}
                    </div>
                    <p className="text-foreground/90 leading-relaxed mb-8 sm:mb-12 flex-1 italic text-base sm:text-lg md:text-xl font-light">
                      "{t.text}"
                    </p>
                    <div className="pt-6 sm:pt-8 border-t border-border/30">
                      <p className="font-bold text-foreground tracking-tight text-sm sm:text-base">{t.name}</p>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-1.5 sm:mt-2 font-bold">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Investidores ── */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="text-center mb-10 sm:mb-14 md:mb-20">
              <span className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-3 sm:mb-4 block font-bold">
                Wealth Management
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                Patrimônio em <span className="text-gold-gradient">evolução</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 md:gap-10">
            {[
              {
                icon: TrendingUp,
                title: "Análise de Valorização",
                desc: "Identificamos ativos com alto potencial de valorização real em regiões estratégicas.",
              },
              {
                icon: Home,
                title: "Oportunidades Off-Market",
                desc: "Acesso a propriedades exclusivas que não estão listadas publicamente.",
              },
              {
                icon: Star,
                title: "Consultoria Premium",
                desc: "Assessoria para diversificação de portfólio imobiliário com foco em alta rentabilidade.",
              },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 150}>
                <div className="bg-card/20 border border-border rounded-2xl sm:rounded-[1.5rem] md:rounded-[2rem] p-6 sm:p-8 md:p-10 hover:border-primary/30 transition-all duration-700 h-full group">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center mb-5 sm:mb-6 md:mb-8 group-hover:bg-primary transition-all duration-500 transform group-hover:-translate-y-2">
                    <item.icon size={22} className="text-primary group-hover:text-primary-foreground transition-colors sm:w-6 sm:h-6 md:w-7 md:h-7" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed font-light text-sm sm:text-base">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Proprietário — Venda/Alugue seu imóvel ── */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 border-y border-border bg-card/5">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 lg:gap-20 items-center">
            <ScrollReveal>
              <div className="max-w-lg">
                <span className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-4 sm:mb-6 block font-bold">
                  Selling Expertise
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-5 sm:mb-8 leading-tight">
                  Seu imóvel com a <span className="text-gold-gradient">estratégia</span> ideal
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-8 sm:mb-12 text-base sm:text-lg font-light">
                  Conectamos sua propriedade ao comprador certo através de marketing de alta performance e rede exclusiva off-market.
                </p>
                <ul className="space-y-4 sm:space-y-6 mb-8 sm:mb-12">
                  {[
                    "Produção Audiovisual de Elite",
                    "Divulgação nos Principais Canais Luxo",
                    "Qualificação Rigorosa de Leads",
                    "Assessoria Jurídica Especializada",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 sm:gap-4 text-foreground font-semibold group text-sm sm:text-base">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex-shrink-0">
                        <Check size={12} className="sm:w-3.5 sm:h-3.5" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <Button asChild className="bg-gold-gradient text-primary-foreground font-bold px-8 sm:px-12 h-12 sm:h-14 md:h-16 shadow-2xl rounded-full btn-shine uppercase tracking-widest text-[10px] sm:text-[11px] w-full sm:w-auto flex items-center justify-center">
                   <a href="https://wa.me/5567991193513?text=Olá! Gostaria de falar sobre o anúncio e avaliação do meu imóvel." target="_blank" rel="noopener noreferrer" className="w-full flex justify-center items-center text-center">
                      Quero anunciar meu imóvel
                   </a>
                </Button>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] lg:rounded-[3rem] p-6 sm:p-8 md:p-10 lg:p-14 shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4 tracking-tight">Diagnóstico de Mercado</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8 md:mb-10 font-light">
                  Descubra o valor real e o potencial de liquidez da sua propriedade com nossa análise técnica.
                </p>
                <form className="space-y-4 sm:space-y-6" onSubmit={handleFormSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <Input 
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleFormChange}
                      placeholder="Nome Completo" 
                      className="bg-background/50 h-12 sm:h-14 rounded-xl sm:rounded-2xl border-border/40 focus:border-primary transition-all text-sm px-4 sm:px-6" 
                      required
                    />
                    <Input 
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="E-mail" 
                      className="bg-background/50 h-12 sm:h-14 rounded-xl sm:rounded-2xl border-border/40 focus:border-primary transition-all text-sm px-4 sm:px-6" 
                      required
                    />
                  </div>
                  <Input 
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    type="tel" 
                    placeholder="WhatsApp" 
                    className="bg-background/50 h-12 sm:h-14 rounded-xl sm:rounded-2xl border-border/40 focus:border-primary transition-all text-sm px-4 sm:px-6" 
                    required
                  />
                  <Input 
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    placeholder="Localização do imóvel" 
                    className="bg-background/50 h-12 sm:h-14 rounded-xl sm:rounded-2xl border-border/40 focus:border-primary transition-all text-sm px-4 sm:px-6" 
                    required
                  />
                  <Textarea 
                    name="details"
                    value={formData.details}
                    onChange={handleFormChange}
                    placeholder="Detalhes do imóvel (opcional)" 
                    rows={3} 
                    className="bg-background/50 rounded-xl sm:rounded-2xl border-border/40 focus:border-primary transition-all text-sm px-4 sm:px-6 py-3 sm:py-4 resize-none" 
                  />
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-primary-foreground font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase h-12 sm:h-14 md:h-16 hover:shadow-2xl transition-all rounded-full text-[10px] sm:text-[11px]"
                  >
                    {isSubmitting ? "Enviando..." : "Solicitar Avaliação Premium"}
                  </Button>
                  <p className="text-[8px] sm:text-[9px] text-muted-foreground/60 leading-relaxed mt-3 sm:mt-4 text-center">
                    ESTOU DE ACORDO EM FORNECER MEU NOME E E-MAIL PARA QUE A AXIS IMOBILIÁRIA ENTRE EM CONTATO COMIGO, E CIENTE DE QUE ESSES DADOS SERÃO UTILIZADOS PELAS ÁREAS DE MARKETING E COMERCIAL DA IMOBILIÁRIA COMO CADASTRO PARA ENVIO DE E-MAILS.
                  </p>
                </form>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Market Indicators ── */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6">
        <div className="container mx-auto text-center">
          <ScrollReveal>
            <div className="mb-10 sm:mb-12 md:mb-16">
              <span className="font-mono text-xs tracking-[0.3em] sm:tracking-[0.4em] uppercase text-primary/60 mb-3 sm:mb-4 block font-bold">
                Mercado em Tempo Real
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-foreground/80 italic">
                Indicadores que valorizam seu patrimônio
              </h2>
            </div>
            <div className="bg-card/20 backdrop-blur-md rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] border border-border/30 p-4 sm:p-6 md:p-8 shadow-inner">
              <MarketIndicators />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Blog / Jornal do Mercado ── */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 border-t border-border">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="text-center mb-10 sm:mb-14 md:mb-20">
              <span className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-3 sm:mb-4 block font-bold">
                Insights & Tendências
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                Jornal do <span className="text-gold-gradient">Mercado Imobiliário</span>
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg mt-3 sm:mt-4 max-w-2xl mx-auto font-light">
                Acompanhe análises, oportunidades e novidades do setor imobiliário.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
            {[
              {
                tag: "Banco Central",
                title: "Copom corta Taxa Selic para 10,25% ao ano",
                excerpt: "Com a inflação controlada sob a meta, o Banco Central mantém o ritmo de afrouxamento monetário, o que já começa a baratear o crédito imobiliário nos principais bancos de varejo do país.",
                date: "24 Março 2026",
                readTime: "3 min de leitura",
                image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800&auto=format&fit=crop"
              },
              {
                tag: "Mercado Imobiliário",
                title: "Caixa Econômica anuncia injeção bilionária no crédito habitacional",
                excerpt: "Instituição destinará novos recursos para linhas SBPE e altera cota de financiamento de imóveis usados, movimentando o mercado secundário na reta final do primeiro semestre.",
                date: "10 Março 2026",
                readTime: "4 min de leitura",
                image: "https://images.unsplash.com/photo-1550565118-3a14e8d0386f?q=80&w=800&auto=format&fit=crop"
              },
              {
                tag: "Tendências",
                title: "Vendas de imóveis de alto padrão e luxo crescem 15% neste trimestre",
                excerpt: "Investidores institucionais e family offices voltam a focar em propriedades de altíssimo padrão como principal ativo de reserva de valor e proteção contra oscilações cambiais.",
                date: "28 Fevereiro 2026",
                readTime: "5 min de leitura",
                image: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?q=80&w=800&auto=format&fit=crop"
              },
            ].map((post, i) => (
              <ScrollReveal key={i} delay={i * 150}>
                <div className="bg-card/30 border border-border/50 rounded-2xl sm:rounded-[1.5rem] md:rounded-[2rem] overflow-hidden hover:border-primary/20 hover:shadow-2xl transition-all duration-700 group h-full flex flex-col cursor-pointer">
                  <div className="h-36 sm:h-40 md:h-48 relative overflow-hidden flex flex-col items-center justify-center text-center">
                    <img src={post.image} alt={post.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    <span className="font-mono text-[10px] tracking-[0.3em] uppercase bg-black/50 text-gold-gradient backdrop-blur-md px-3 py-1 mt-auto mb-4 rounded-full font-bold z-10">{post.tag}</span>
                  </div>
                  <div className="p-5 sm:p-6 md:p-8 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <span className="text-[9px] font-mono tracking-widest uppercase text-primary/60 font-bold">{post.date}</span>
                      <span className="text-[8px] font-mono uppercase text-muted-foreground/50">{post.readTime}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4 tracking-tight group-hover:text-primary transition-colors leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground/80 text-xs sm:text-sm leading-relaxed flex-1">
                      {post.excerpt}
                    </p>
                    <div className="mt-5 sm:mt-6 pt-3 sm:pt-4 border-t border-border/30 flex items-center justify-between">
                      <span className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-primary group-hover:text-gold-gradient transition-colors">
                        Ler matéria completa →
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-20 sm:py-28 md:py-32 lg:py-40 px-4 sm:px-6 bg-gradient-to-b from-transparent via-card/5 to-background">
        <div className="container mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6 sm:mb-8 md:mb-10 max-w-5xl mx-auto leading-[1.1]">
              Ainda não encontrou o que <span className="text-gold-gradient">buscava?</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg md:text-xl lg:text-2xl mb-10 sm:mb-12 md:mb-16 max-w-2xl mx-auto font-light leading-relaxed">
              Nossa curadoria off-market possui propriedades exclusivas que não estão listadas publicamente em canais comuns.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8">
              <Button asChild className="bg-gold-gradient text-primary-foreground font-bold px-6 sm:px-10 md:px-12 h-12 sm:h-14 md:h-16 text-[10px] sm:text-[11px] tracking-widest uppercase w-full sm:w-auto shadow-2xl rounded-full btn-shine shadow-primary/30 flex items-center justify-center">
                <a href="https://wa.me/5567991193513?text=Olá! Gostaria de falar com um especialista sobre os imóveis." target="_blank" rel="noopener noreferrer" className="w-full flex justify-center items-center text-center">
                  Falar com especialista no WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" className="border-border/50 px-6 sm:px-10 md:px-12 h-12 sm:h-14 md:h-16 text-[10px] sm:text-[11px] tracking-widest uppercase w-full sm:w-auto rounded-full font-bold hover:bg-white hover:text-black transition-all flex items-center justify-center">
                <Link to="/imoveis" className="w-full flex justify-center items-center text-center">Ver todos os imóveis</Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}

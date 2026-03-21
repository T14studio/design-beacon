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
              <span className="bg-primary/20 border border-primary/40 text-primary text-[10px] font-mono tracking-[0.2em] uppercase px-6 py-2 rounded-full backdrop-blur-sm">
                Venda
              </span>
              <span className="bg-primary/20 border border-primary/40 text-primary text-[10px] font-mono tracking-[0.2em] uppercase px-6 py-2 rounded-full backdrop-blur-sm">
                Locação
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold tracking-tight leading-[1.0] mb-8 max-w-4xl">
              <span className="text-gold-gradient">Residências</span>{" "}
              <span className="text-foreground drop-shadow-2xl">que Inspiram</span>
            </h1>

            <p className="text-foreground/80 text-lg md:text-2xl max-w-2xl mb-12 font-light drop-shadow-sm leading-relaxed">
              Descubra imóveis exclusivos com a curadoria especializada da Ética Áxis. Transformamos o conceito de morar em uma experiência extraordinária.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-gold-gradient text-primary-foreground font-bold tracking-[0.1em] uppercase hover:opacity-90 transition-all px-10 py-8 shadow-2xl btn-shine rounded-full group">
                <Link to="/imoveis" className="flex items-center gap-3">
                  Explorar portfólio <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Scroll indicator */}
          <button 
            onClick={scrollToNext}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 text-muted-foreground/30 hover:text-primary transition-all duration-500 scale-90 hover:scale-100"
          >
            <span className="text-[10px] font-mono tracking-[0.4em] uppercase">Descubra mais</span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-primary/50 to-transparent animate-pulse" />
          </button>
        </div>
      </section>

      {/* ── Marquee ── */}
      <div ref={marqueeRef}>
        <Marquee />
      </div>

      {/* ── Featured (Imóveis) ── */}
      <section className="py-32 px-6">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="flex items-end justify-between mb-20 border-b border-border/50 pb-12">
              <div>
                <span className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-4 block font-bold">
                  Curadoria Exclusiva
                </span>
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
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

          <div className="space-y-12">
            {featured.map((p, i) => (
              <ScrollReveal key={p.id} delay={i * 200}>
                <PropertyCard property={p} variant="featured" />
              </ScrollReveal>
            ))}
          </div>

          <div className="mt-16 text-center md:hidden">
             <Button asChild variant="outline" className="border-primary/30 text-primary rounded-full px-8 h-12 font-bold tracking-widest uppercase text-[10px]">
                <Link to="/imoveis">Ver todos os imóveis</Link>
             </Button>
          </div>
        </div>
      </section>

      {/* ── Mapa Teaser ── */}
      <section className="py-32 px-6 bg-card/10">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <ScrollReveal>
              <span className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-4 block font-bold">Localização</span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 leading-tight">
                Onde a sofisticação <br/>encontra a <span className="text-gold-gradient">região ideal</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-10 text-lg max-w-lg font-light">
                Navegue pelas localizações mais nobres e encontre o imóvel ideal no bairro que combina com suas conquistas.
              </p>
              <Button asChild variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 h-16 px-10 rounded-full font-bold tracking-widest uppercase text-[11px] group">
                <Link to="/imoveis" className="flex items-center gap-2">
                  <MapPin size={18} className="group-hover:scale-110 transition-transform" />
                  Explorar no mapa
                </Link>
              </Button>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <div className="h-[450px] bg-background border border-border/50 rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
                <Suspense fallback={<div className="w-full h-full bg-card animate-pulse" />}>
                  <div className="absolute inset-0 grayscale opacity-60 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-1000 pointer-events-none">
                    <PropertyMap properties={featured} className="h-full border-none" />
                  </div>
                </Suspense>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40 opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center p-12">
                   <div className="text-center p-10 backdrop-blur-xl bg-background/30 border border-white/5 rounded-[2rem] shadow-2xl group-hover:scale-105 transition-transform duration-700 pointer-events-none">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 border border-primary/20">
                         <MapPin size={32} className="text-primary animate-pulse" />
                      </div>
                      <h3 className="text-xl font-bold mb-3 tracking-tight">Geolocalização Ativa</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-mono leading-relaxed font-bold">
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
      <section className="py-32 px-6">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-[3rem] p-12 md:p-20 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:scale-175 transition-transform duration-1000 text-primary">
                <Calculator size={300} />
              </div>
              <div className="relative z-10 max-w-2xl">
                <div className="w-16 h-1 bg-primary/30 mb-8 rounded-full" />
                <h2 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight mb-8 leading-tight">
                  Planeje sua <br/>próxima conquista
                </h2>
                <p className="text-muted-foreground text-lg md:text-xl mb-12 leading-relaxed font-light">
                  Utilize nossa ferramenta especializada de simulação financeira para descobrir as melhores condições para o seu investimento imobiliário.
                </p>
                <div className="flex flex-wrap gap-5">
                  <Button asChild size="lg" className="bg-gold-gradient text-primary-foreground font-bold px-10 h-16 rounded-full hover:opacity-90 transition-all shadow-xl btn-shine uppercase tracking-widest text-[11px]">
                    <Link to="/simulador">Simular Agora</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-primary/30 text-primary hover:bg-primary/10 px-10 h-16 rounded-full font-bold tracking-widest uppercase text-[11px]">
                    <a href="https://wa.me/5567991193513?text=Olá! Gostaria de falar com um especialista sobre simulação de financiamento." target="_blank" rel="noopener noreferrer">
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
      <section className="py-32 px-6 border-y border-border overflow-hidden bg-card/5">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
              <div className="max-w-xl">
                <span className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-4 block font-bold">
                  Relatos de Confiança
                </span>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                  O que nossos clientes <br/><span className="text-gold-gradient">experimentam</span>
                </h2>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={scrollPrev}
                  className="w-14 h-14 rounded-full border border-border hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-all group active:scale-95"
                  aria-label="Anterior"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={scrollNext}
                  className="w-14 h-14 rounded-full border border-border hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-all group active:scale-95"
                  aria-label="Próximo"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </ScrollReveal>

          <div className="embla overflow-hidden" ref={emblaRef}>
            <div className="embla__container flex">
              {testimonials.map((t, i) => (
                <div key={i} className="embla__slide flex-[0_0_100%] md:flex-[0_0_450px] px-4">
                  <div className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-[2.5rem] p-10 h-full flex flex-col shadow-sm hover:shadow-2xl hover:border-primary/20 hover:bg-card/60 transition-all duration-700 group">
                    <div className="flex gap-1 mb-10">
                      {Array.from({ length: t.stars }).map((_, j) => (
                        <Star key={j} size={16} className="fill-primary text-primary group-hover:scale-110 transition-transform" style={{ transitionDelay: `${j * 50}ms` }} />
                      ))}
                    </div>
                    <p className="text-foreground/90 leading-relaxed mb-12 flex-1 italic text-xl font-light">
                      "{t.text}"
                    </p>
                    <div className="pt-8 border-t border-border/30">
                      <p className="font-bold text-foreground tracking-tight">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.3em] mt-2 font-bold">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Investidores ── */}
      <section className="py-32 px-6">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="text-center mb-20">
              <span className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-4 block font-bold">
                Wealth Management
              </span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Patrimônio em <span className="text-gold-gradient">evolução</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
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
                <div className="bg-card/20 border border-border rounded-[2rem] p-10 hover:border-primary/30 transition-all duration-700 h-full group">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 group-hover:bg-primary transition-all duration-500 transform group-hover:-translate-y-2">
                    <item.icon size={28} className="text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed font-light">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Proprietário — Venda/Alugue seu imóvel ── */}
      <section className="py-32 px-6 border-y border-border bg-card/5">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <ScrollReveal>
              <div className="max-w-lg">
                <span className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-6 block font-bold">
                  Selling Expertise
                </span>
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 leading-tight">
                  Seu imóvel com a <span className="text-gold-gradient">estratégia</span> ideal
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-12 text-lg font-light">
                  Conectamos sua propriedade ao comprador certo através de marketing de alta performance e rede exclusiva off-market.
                </p>
                <ul className="space-y-6 mb-12">
                  {[
                    "Produção Audiovisual de Elite",
                    "Divulgação nos Principais Canais Luxo",
                    "Qualificação Rigorosa de Leads",
                    "Assessoria Jurídica Especializada",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-4 text-foreground font-semibold group">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Check size={14} />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <Button asChild className="bg-gold-gradient text-primary-foreground font-bold px-12 h-16 shadow-2xl rounded-full btn-shine uppercase tracking-widest text-[11px]">
                   <a href="https://wa.me/5567991193513?text=Olá! Gostaria de falar sobre o anúncio e avaliação do meu imóvel." target="_blank" rel="noopener noreferrer">
                      Quero anunciar meu imóvel
                   </a>
                </Button>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                <h3 className="text-3xl font-bold text-foreground mb-4 tracking-tight">Diagnóstico de Mercado</h3>
                <p className="text-sm text-muted-foreground mb-10 font-light">
                  Descubra o valor real e o potencial de liquidez da sua propriedade com nossa análise técnica.
                </p>
                <form className="space-y-6" onSubmit={handleFormSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input 
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleFormChange}
                      placeholder="Nome Completo" 
                      className="bg-background/50 h-14 rounded-2xl border-border/40 focus:border-primary transition-all text-sm px-6" 
                      required
                    />
                    <Input 
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="E-mail" 
                      className="bg-background/50 h-14 rounded-2xl border-border/40 focus:border-primary transition-all text-sm px-6" 
                      required
                    />
                  </div>
                  <Input 
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    type="tel" 
                    placeholder="WhatsApp" 
                    className="bg-background/50 h-14 rounded-2xl border-border/40 focus:border-primary transition-all text-sm px-6" 
                    required
                  />
                  <Input 
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    placeholder="Localização do imóvel" 
                    className="bg-background/50 h-14 rounded-2xl border-border/40 focus:border-primary transition-all text-sm px-6" 
                    required
                  />
                  <Textarea 
                    name="details"
                    value={formData.details}
                    onChange={handleFormChange}
                    placeholder="Detalhes do imóvel (opcional)" 
                    rows={4} 
                    className="bg-background/50 rounded-2xl border-border/40 focus:border-primary transition-all text-sm px-6 py-4 resize-none" 
                  />
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-primary-foreground font-bold tracking-[0.2em] uppercase h-16 hover:shadow-2xl transition-all rounded-full text-[11px]"
                  >
                    {isSubmitting ? "Enviando..." : "Solicitar Avaliação Premium"}
                  </Button>
                  <p className="text-[9px] text-muted-foreground/60 leading-relaxed mt-4 text-center">
                    ESTOU DE ACORDO EM FORNECER MEU NOME E E-MAIL PARA QUE A AXIS IMOBILIÁRIA ENTRE EM CONTATO COMIGO, E CIENTE DE QUE ESSES DADOS SERÃO UTILIZADOS PELAS ÁREAS DE MARKETING E COMERCIAL DA IMOBILIÁRIA COMO CADASTRO PARA ENVIO DE E-MAILS.
                  </p>
                </form>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Market Indicators ── */}
      <section className="py-32 px-6">
        <div className="container mx-auto text-center">
          <ScrollReveal>
            <div className="mb-16">
              <span className="font-mono text-xs tracking-[0.4em] uppercase text-primary/60 mb-4 block font-bold">
                Mercado em Tempo Real
              </span>
              <h2 className="text-2xl md:text-3xl font-light text-foreground/80 italic">
                Indicadores que valorizam seu patrimônio
              </h2>
            </div>
            <div className="bg-card/20 backdrop-blur-md rounded-[2.5rem] border border-border/30 p-8 shadow-inner">
              <MarketIndicators />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Blog / Jornal do Mercado ── */}
      <section className="py-32 px-6 border-t border-border">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="text-center mb-20">
              <span className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-4 block font-bold">
                Insights & Tendências
              </span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Jornal do <span className="text-gold-gradient">Mercado Imobiliário</span>
              </h2>
              <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto font-light">
                Acompanhe análises, oportunidades e novidades do setor imobiliário.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                tag: "Mercado",
                title: "Tendências do mercado imobiliário em 2025",
                excerpt: "Descubra quais regiões e tipos de imóveis estão em alta e como aproveitar as melhores oportunidades de investimento.",
                date: "Em breve",
              },
              {
                tag: "Financiamento",
                title: "Como escolher o melhor banco para financiar seu imóvel",
                excerpt: "Comparativo entre Caixa, Santander e Bradesco: taxas, prazos e condições para você tomar a melhor decisão.",
                date: "Em breve",
              },
              {
                tag: "Investimento",
                title: "Por que investir em imóveis é uma decisão inteligente",
                excerpt: "Entenda os fundamentos que fazem do mercado imobiliário um porto seguro para seu patrimônio.",
                date: "Em breve",
              },
            ].map((post, i) => (
              <ScrollReveal key={i} delay={i * 150}>
                <div className="bg-card/30 border border-border/50 rounded-[2rem] overflow-hidden hover:border-primary/20 hover:shadow-2xl transition-all duration-700 group h-full flex flex-col">
                  <div className="h-48 bg-gradient-to-br from-primary/10 via-card/60 to-background flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.08),transparent)] group-hover:scale-110 transition-transform duration-700" />
                    <span className="font-mono text-xs tracking-[0.3em] uppercase text-primary/50 font-bold z-10">{post.tag}</span>
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <span className="text-[9px] font-mono tracking-widest uppercase text-primary/60 mb-3 font-bold">{post.date}</span>
                    <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight group-hover:text-primary transition-colors leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground/80 text-sm leading-relaxed flex-1">
                      {post.excerpt}
                    </p>
                    <div className="mt-6 pt-4 border-t border-border/30">
                      <span className="text-[10px] font-mono tracking-widest uppercase text-primary/40 group-hover:text-primary/70 transition-colors">
                        Leia em breve →
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
      <section className="py-40 px-6 bg-gradient-to-b from-transparent via-card/5 to-background">
        <div className="container mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-7xl font-bold tracking-tight mb-10 max-w-5xl mx-auto leading-[1.1]">
              Ainda não encontrou o que <span className="text-gold-gradient">buscava?</span>
            </h2>
            <p className="text-muted-foreground text-xl md:text-2xl mb-16 max-w-2xl mx-auto font-light leading-relaxed">
              Nossa curadoria off-market possui propriedades exclusivas que não estão listadas publicamente em canais comuns.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <Button asChild size="lg" className="bg-gold-gradient text-primary-foreground font-bold px-12 py-9 text-[11px] tracking-widest uppercase w-full md:w-auto shadow-2xl rounded-full btn-shine shadow-primary/30">
                <a href="https://wa.me/5567991193513?text=Olá! Gostaria de falar com um especialista sobre os imóveis." target="_blank" rel="noopener noreferrer">
                  Falar com especialista no WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-border/50 px-12 py-9 text-[11px] tracking-widest uppercase w-full md:w-auto rounded-full font-bold hover:bg-white hover:text-black transition-all h-16">
                <Link to="/imoveis">Ver todos os imóveis</Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}

import { useState, useMemo, useRef, lazy, Suspense } from "react";
import { properties } from "@/data/properties";
import { MapPin, Search, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import ScrollReveal from "@/components/ScrollReveal";
import BackButton from "@/components/BackButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PropertyMap = lazy(() => import("@/components/PropertyMap"));

const types = ["Todos", "Apartamento", "Casa", "Cobertura", "Terreno", "Comercial", "Rural"] as const;
const locations = ["Todos", "São Paulo", "Bertioga", "Barueri", "Porto Feliz", "Campo Grande"] as const;
const neighborhoods = ["Todos", "Jardins", "Riviera de São Lourenço", "Vila Nova Conceição", "Itaim Bibi", "Alphaville", "Moema", "Porto Feliz", "Tamboré", "Jardim dos Estados"] as const;
const priceRanges = [
  { label: "Qualquer valor", value: "all" },
  { label: "Até R$ 500 mil", value: "0-500000" },
  { label: "R$ 500 mil — R$ 1 mi", value: "500000-1000000" },
  { label: "R$ 1 mi — R$ 3 mi", value: "1000000-3000000" },
  { label: "R$ 3 mi — R$ 5 mi", value: "3000000-5000000" },
  { label: "R$ 5 mi — R$ 10 mi", value: "5000000-10000000" },
  { label: "Acima de R$ 10 mi", value: "10000000-999999999" },
];
const bedroomOptions = ["Todos", "1+", "2+", "3+", "4+", "5+"] as const;
const bathroomOptions = ["Todos", "1+", "2+", "3+", "4+"] as const;
const parkingOptions = ["Todos", "1+", "2+", "3+", "4+"] as const;

export default function Properties() {
  const [typeFilter, setTypeFilter] = useState<string>("Todos");
  const [locationFilter, setLocationFilter] = useState<string>("Todos");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>("Todos");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [bedroomFilter, setBedroomFilter] = useState<string>("Todos");
  const [bathroomFilter, setBathroomFilter] = useState<string>("Todos");
  const [parkingFilter, setParkingFilter] = useState<string>("Todos");
  const [onlyLaunches, setOnlyLaunches] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const typeMatch = typeFilter === "Todos" || 
        (typeFilter === "Terreno" && p.type === "Terreno") || 
        p.type === typeFilter;
      if (!typeMatch) return false;
      if (locationFilter !== "Todos" && p.location !== locationFilter) return false;
      if (neighborhoodFilter !== "Todos" && p.neighborhood !== neighborhoodFilter) return false;
      
      if (priceRange !== "all") {
        const [min, max] = priceRange.split("-").map(Number);
        if (p.price < min || p.price > max) return false;
      }

      if (bedroomFilter !== "Todos") {
        const minBedrooms = parseInt(bedroomFilter);
        if (p.bedrooms < minBedrooms) return false;
      }
      if (bathroomFilter !== "Todos") {
        const minBathrooms = parseInt(bathroomFilter);
        if (p.bathrooms < minBathrooms) return false;
      }
      if (parkingFilter !== "Todos") {
        const minParking = parseInt(parkingFilter);
        if (p.parking < minParking) return false;
      }

      return true;
    });
  }, [typeFilter, locationFilter, neighborhoodFilter, priceRange, bedroomFilter, bathroomFilter, parkingFilter, onlyLaunches]);

  const clearFilters = () => {
    setTypeFilter("Todos");
    setLocationFilter("Todos");
    setNeighborhoodFilter("Todos");
    setPriceRange("all");
    setBedroomFilter("Todos");
    setBathroomFilter("Todos");
    setParkingFilter("Todos");
    setOnlyLaunches(false);
  };

  const scrollToMap = () => {
    mapRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-40 pb-12 px-6">
        <div className="container mx-auto">
          <div className="mb-10">
            <BackButton />
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border/50 pb-12">
            <div>
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary mb-3 block font-bold">
                Exclusividade · Ética Áxis
              </span>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                Nossos <span className="text-gold-gradient">imóveis</span>
              </h1>
            </div>
            <button
              onClick={scrollToMap}
              className="flex items-center gap-3 text-[10px] font-bold tracking-widest uppercase px-8 py-4 rounded-full border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all duration-500 w-fit bg-card/20 hover:bg-card/40 backdrop-blur-sm"
            >
              <MapPin size={14} className="text-primary" />
              Explorar Localização
            </button>
          </div>
        </div>
      </section>

      {/* Enhanced Filters */}
      <section className="px-6 pb-16">
        <div className="container mx-auto">
          <div className="bg-card/50 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
            
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Search size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground tracking-tight">Encontre o imóvel ideal</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-mono">Filtros avançados</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              {/* Tipo */}
              <div>
                <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-primary/70 mb-2 font-bold ml-4">Tipo de imóvel</p>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="rounded-full border-border/40 bg-background/60 text-sm h-13 px-6 focus:ring-primary/20 transition-all hover:bg-background/80 hover:border-primary/30">
                    <SelectValue placeholder="Tipo de imóvel" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
                    {types.map((t) => (
                      <SelectItem key={t} value={t} className="rounded-lg focus:bg-primary/10">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Cidade */}
              <div>
                <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-primary/70 mb-2 font-bold ml-4">Cidade</p>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="rounded-full border-border/40 bg-background/60 text-sm h-13 px-6 focus:ring-primary/20 transition-all hover:bg-background/80 hover:border-primary/30">
                    <SelectValue placeholder="Cidade" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
                    {locations.map((l) => (
                      <SelectItem key={l} value={l} className="rounded-lg focus:bg-primary/10">{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Bairro */}
              <div>
                <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-primary/70 mb-2 font-bold ml-4">Bairro</p>
                <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
                  <SelectTrigger className="rounded-full border-border/40 bg-background/60 text-sm h-13 px-6 focus:ring-primary/20 transition-all hover:bg-background/80 hover:border-primary/30">
                    <SelectValue placeholder="Bairro" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
                    {neighborhoods.map((n) => (
                      <SelectItem key={n} value={n} className="rounded-lg focus:bg-primary/10">{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Faixa de valor */}
              <div>
                <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-primary/70 mb-2 font-bold ml-4">Faixa de valor</p>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="rounded-full border-border/40 bg-background/60 text-sm h-13 px-6 focus:ring-primary/20 transition-all hover:bg-background/80 hover:border-primary/30">
                    <SelectValue placeholder="Faixa de valor" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
                    {priceRanges.map((r) => (
                      <SelectItem key={r.value} value={r.value} className="rounded-lg focus:bg-primary/10">{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {/* Dormitórios */}
              <div>
                <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-primary/70 mb-2 font-bold ml-4">Dormitórios</p>
                <Select value={bedroomFilter} onValueChange={setBedroomFilter}>
                  <SelectTrigger className="rounded-full border-border/40 bg-background/60 text-sm h-13 px-6 focus:ring-primary/20 transition-all hover:bg-background/80 hover:border-primary/30">
                    <SelectValue placeholder="Dormitórios" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
                    {bedroomOptions.map((b) => (
                      <SelectItem key={b} value={b} className="rounded-lg focus:bg-primary/10">{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Banheiros */}
              <div>
                <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-primary/70 mb-2 font-bold ml-4">Banheiros</p>
                <Select value={bathroomFilter} onValueChange={setBathroomFilter}>
                  <SelectTrigger className="rounded-full border-border/40 bg-background/60 text-sm h-13 px-6 focus:ring-primary/20 transition-all hover:bg-background/80 hover:border-primary/30">
                    <SelectValue placeholder="Banheiros" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
                    {bathroomOptions.map((b) => (
                      <SelectItem key={b} value={b} className="rounded-lg focus:bg-primary/10">{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Vagas */}
              <div>
                <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-primary/70 mb-2 font-bold ml-4">Vagas</p>
                <Select value={parkingFilter} onValueChange={setParkingFilter}>
                  <SelectTrigger className="rounded-full border-border/40 bg-background/60 text-sm h-13 px-6 focus:ring-primary/20 transition-all hover:bg-background/80 hover:border-primary/30">
                    <SelectValue placeholder="Vagas" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
                    {parkingOptions.map((p) => (
                      <SelectItem key={p} value={p} className="rounded-lg focus:bg-primary/10">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Lançamentos */}
              <div className="flex flex-col justify-end">
                <button
                  onClick={() => setOnlyLaunches(!onlyLaunches)}
                  className={`h-13 rounded-full border text-sm font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-300 ${
                    onlyLaunches
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-background/60 border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  <Sparkles size={14} />
                  Lançamentos
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/20">
              <span className="text-sm text-foreground/70 font-medium">
                <span className="text-primary font-bold">{filtered.length}</span> {filtered.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
              </span>
              <button
                onClick={clearFilters}
                className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
              >
                Limpar filtros
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="px-6 pb-12">
        <div className="container mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 rounded-full bg-card/40 border border-border/50 flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-muted-foreground/40" />
              </div>
              <p className="text-xl font-bold text-foreground mb-2">Nenhum imóvel encontrado</p>
              <p className="text-muted-foreground text-sm">Tente ajustar os filtros para encontrar mais opções.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((p, i) => (
                <ScrollReveal key={p.id} delay={i * 100}>
                  <PropertyCard property={p} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Map at bottom */}
      <section ref={mapRef} className="px-6 pb-24">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="mb-8">
              <span className="font-mono text-xs tracking-widest uppercase text-primary mb-2 block">
                Localização
              </span>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Mapa dos imóveis
              </h2>
              <p className="text-muted-foreground mt-2 max-w-lg">
                Explore a localização exata de cada propriedade no mapa interativo.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <Suspense fallback={<div className="h-[500px] bg-card border border-border rounded-lg animate-pulse" />}>
              <PropertyMap properties={filtered} className="h-[500px]" />
            </Suspense>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}

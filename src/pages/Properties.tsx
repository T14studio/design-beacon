import { useState, useMemo, useRef, lazy, Suspense } from "react";
import { properties } from "@/data/properties";
import { MapPin } from "lucide-react";
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

const types = ["Todos", "Apartamento", "Casa", "Cobertura", "Terreno"] as const;
const locations = ["Todos", "São Paulo", "Bertioga", "Barueri"] as const;

export default function Properties() {
  const [typeFilter, setTypeFilter] = useState<string>("Todos");
  const [locationFilter, setLocationFilter] = useState<string>("Todos");
  const mapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (typeFilter !== "Todos" && p.type !== typeFilter) return false;
      if (locationFilter !== "Todos" && p.location !== locationFilter) return false;
      return true;
    });
  }, [typeFilter, locationFilter]);

  const scrollToMap = () => {
    mapRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-28 md:pt-32 pb-8 md:pb-12 px-4 md:px-6">
        <div className="container mx-auto">
          <div className="mb-4 md:mb-6">
            <BackButton />
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="font-mono text-xs tracking-widest uppercase text-primary mb-2 block">
                Portfólio
              </span>
              <h1 className="text-2xl md:text-5xl font-bold tracking-tight text-foreground">
                Nossos imóveis
              </h1>
            </div>
            <button
              onClick={scrollToMap}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all duration-300 w-fit active:scale-[0.97]"
            >
              <MapPin size={14} />
              Ver no mapa
            </button>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 md:px-6 pb-8 md:pb-12">
        <div className="container mx-auto flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="w-full sm:w-48">
            <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-2">Tipo</p>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="rounded-full border-border bg-background text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-2">Localização</p>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="rounded-full border-border bg-background text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="px-4 md:px-6 pb-8 md:pb-12">
        <div className="container mx-auto">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-16">
              Nenhum imóvel encontrado com os filtros selecionados.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
      <section ref={mapRef} className="px-4 md:px-6 pb-16 md:pb-24">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="mb-6 md:mb-8">
              <span className="font-mono text-xs tracking-widest uppercase text-primary mb-2 block">
                Localização
              </span>
              <h2 className="text-xl md:text-3xl font-bold tracking-tight text-foreground">
                Mapa dos imóveis
              </h2>
              <p className="text-muted-foreground mt-2 max-w-lg text-sm">
                Explore a localização exata de cada propriedade no mapa interativo.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <Suspense fallback={<div className="h-[350px] md:h-[500px] bg-card border border-border rounded-lg animate-pulse" />}>
              <PropertyMap properties={filtered} className="h-[350px] md:h-[500px]" />
            </Suspense>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}

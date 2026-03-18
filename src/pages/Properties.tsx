import { useState, useMemo, lazy, Suspense } from "react";
import { properties, type Property } from "@/data/properties";
import { MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import ScrollReveal from "@/components/ScrollReveal";
import BackButton from "@/components/BackButton";
import { cn } from "@/lib/utils";

const PropertyMap = lazy(() => import("@/components/PropertyMap"));

const types = ["Todos", "Apartamento", "Casa", "Cobertura", "Terreno"] as const;
const locations = ["Todos", "São Paulo", "Bertioga", "Barueri"] as const;

export default function Properties() {
  const [typeFilter, setTypeFilter] = useState<string>("Todos");
  const [locationFilter, setLocationFilter] = useState<string>("Todos");
  const [showMap, setShowMap] = useState(false);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (typeFilter !== "Todos" && p.type !== typeFilter) return false;
      if (locationFilter !== "Todos" && p.location !== locationFilter) return false;
      return true;
    });
  }, [typeFilter, locationFilter]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-32 pb-12 px-6">
        <div className="container mx-auto">
          <div className="mb-6">
            <BackButton />
          </div>
          <div className="flex items-end justify-between">
          <div>
            <span className="font-mono text-xs tracking-widest uppercase text-primary mb-2 block">
              Portfólio
            </span>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              Nossos imóveis
            </h1>
          </div>
          <button
            onClick={() => setShowMap(!showMap)}
            className={cn(
              "flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border transition-all duration-300",
              showMap
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            <MapPin size={14} />
            {showMap ? "Ver lista" : "Ver no mapa"}
          </button>
        </div>
        </div>
      </section>

      {/* Filters */}
      <section className="px-6 pb-12">
        <div className="container mx-auto flex flex-wrap gap-8">
          <div>
            <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-2">Tipo</p>
            <div className="flex flex-wrap gap-2">
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    "text-xs font-medium tracking-wide px-4 py-2 rounded-full border transition-all duration-300",
                    typeFilter === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-2">Localização</p>
            <div className="flex flex-wrap gap-2">
              {locations.map((l) => (
                <button
                  key={l}
                  onClick={() => setLocationFilter(l)}
                  className={cn(
                    "text-xs font-medium tracking-wide px-4 py-2 rounded-full border transition-all duration-300",
                    locationFilter === l
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Map or Grid */}
      <section className="px-6 pb-24">
        <div className="container mx-auto">
          {showMap ? (
            <Suspense fallback={<div className="h-[500px] bg-card border border-border rounded-lg animate-pulse" />}>
              <PropertyMap properties={filtered} className="h-[500px]" />
            </Suspense>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-16">
              Nenhum imóvel encontrado com os filtros selecionados.
            </p>
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

      <Footer />
    </div>
  );
}

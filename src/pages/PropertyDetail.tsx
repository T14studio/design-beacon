import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Bed, Bath, Maximize, Car, Check, MessageCircle, MapPin } from "lucide-react";
import { properties, formatPrice } from "@/data/properties";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import BackButton from "@/components/BackButton";
import { useState, lazy, Suspense } from "react";

const PropertyMapSingle = lazy(() => import("@/components/PropertyMapSingle"));

export default function PropertyDetail() {
  const { id } = useParams();
  const property = properties.find((p) => p.id === id);
  const [selectedImg, setSelectedImg] = useState(0);

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Imóvel não encontrado</h1>
          <Button asChild variant="outline">
            <Link to="/imoveis">Voltar aos imóveis</Link>
          </Button>
        </div>
      </div>
    );
  }

  const specs = [
    { icon: Bed, value: property.bedrooms, label: "Quartos" },
    { icon: Bath, value: property.bathrooms, label: "Banheiros" },
    { icon: Maximize, value: `${property.area}m²`, label: "Área" },
    { icon: Car, value: property.parking, label: "Vagas" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Back link */}
      <div className="pt-32 pb-4 px-6">
        <div className="container mx-auto">
          <BackButton />
        </div>
      </div>
      <section className="px-6 pb-8">
        <div className="container mx-auto">
          <div className="relative h-[50vh] md:h-[60vh] rounded-2xl overflow-hidden mb-4 shadow-xl">
            <img
              src={property.images[selectedImg]}
              alt={property.title}
              className="w-full h-full object-cover transition-all duration-1000"
            />
            <span className="absolute top-6 left-6 bg-primary text-primary-foreground text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-2 rounded-full shadow-lg">
              {property.mode}
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {property.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImg(i)}
                className={`h-20 w-28 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                  i === selectedImg ? "border-primary scale-95 shadow-inner" : "border-transparent opacity-60 hover:opacity-100 hover:scale-105"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Info */}
      <section className="px-6 pb-24">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main */}
            <div className="lg:col-span-2">
              <ScrollReveal>
                <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary block mb-3 font-bold">
                  {property.type} • {property.neighborhood}, {property.location}
                </span>
                {property.address && (
                  <p className="text-xs text-muted-foreground/60 font-mono mb-2">{property.address}</p>
                )}
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 leading-[1.1] break-words">
                  {property.title}
                </h1>
                <p className="text-gold-gradient text-3xl sm:text-4xl font-bold mb-10 tracking-tight">
                  {formatPrice(property.price, property.mode)}
                </p>

                {/* Specs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                  {specs.filter(s => typeof s.value === 'string' || s.value > 0).map((s) => (
                    <div key={s.label} className="bg-card/30 border border-border rounded-2xl p-4 sm:p-6 text-center hover:border-primary/20 transition-all group">
                      <s.icon size={24} className="mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
                      <p className="text-xl font-bold text-foreground">{s.value}</p>
                      <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/60 mt-1">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                {property.type === "Terreno" && property.potential && (
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 mb-12 shadow-inner">
                    <h3 className="text-sm font-mono tracking-widest uppercase text-primary mb-4 font-bold flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Potencial Construtivo
                    </h3>
                    <p className="text-foreground/90 italic leading-relaxed text-lg">{property.potential}</p>
                  </div>
                )}

                {/* Description */}
                <div className="prose prose-invert max-w-none">
                  <h3 className="text-xl font-bold mb-4 text-foreground">Sobre o imóvel</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg mb-10">
                    {property.description}
                  </p>

                  {/* Features */}
                  <h3 className="text-xl font-bold mb-5 text-foreground">Características</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {property.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-base text-muted-foreground/80 group">
                        <div className="p-1 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Check size={14} className="text-primary" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <ScrollReveal delay={200}>
                <div className="bg-card/40 backdrop-blur-md border border-border rounded-2xl p-6 sm:p-8 sticky top-32 shadow-2xl">
                  <h3 className="text-2xl font-bold mb-3">Interesse imediato?</h3>
                  <p className="text-sm text-muted-foreground/70 mb-8 leading-relaxed">
                    Fale agora com nosso especialista e receba um atendimento exclusivo e personalizado.
                  </p>
                  <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                    <Input placeholder="Seu Nome" className="bg-background h-12 rounded-xl focus:ring-primary/20" />
                    <Input type="email" placeholder="E-mail" className="bg-background h-12 rounded-xl focus:ring-primary/20" />
                    <Input type="tel" placeholder="WhatsApp / Telefone" className="bg-background h-12 rounded-xl focus:ring-primary/20" />
                    <Textarea placeholder="Como podemos te ajudar?" rows={3} className="bg-background rounded-xl focus:ring-primary/20" />
                    <Button className="w-full bg-gold-gradient text-primary-foreground font-bold tracking-widest uppercase h-14 hover:shadow-lg transition-all rounded-full btn-shine shadow-gold-gradient/20">
                      Solicitar Contato
                    </Button>
                  </form>

                  <div className="mt-6 pt-6 border-t border-border/50">
                    <Button
                      asChild
                      variant="outline"
                      className="w-full h-14 rounded-full border-green-600/30 text-green-500 hover:bg-green-600/10 hover:text-green-400 font-bold tracking-wide transition-all"
                    >
                      <a
                        href={`https://wa.me/5567991193513?text=Olá! Tenho interesse no imóvel: ${property.title}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3"
                      >
                        <MessageCircle size={20} /> WhatsApp Direto
                      </a>
                    </Button>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── Seção de Localização ── */}
      <section className="px-6 pb-24">
        <div className="container mx-auto">
          <ScrollReveal>
            <div className="border-t border-border/30 pt-12 mb-10">
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary mb-3 block font-bold">
                Localização
              </span>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {property.hasLocation ? (
                    <>
                      {property.address
                        ? property.address
                        : `${property.neighborhood}, ${property.location}`}
                    </>
                  ) : (
                    "Localização sob consulta"
                  )}
                </h2>
                {property.hasLocation && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-primary border border-primary/20 hover:border-primary/40 px-5 py-2.5 rounded-full transition-all duration-300 bg-primary/5 hover:bg-primary/10 whitespace-nowrap"
                  >
                    <MapPin size={13} />
                    Ver no Google Maps
                  </a>
                )}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="h-[320px] md:h-[420px] rounded-2xl overflow-hidden shadow-2xl">
              <Suspense
                fallback={
                  <div className="h-full w-full bg-card/30 animate-pulse rounded-2xl border border-border/30" />
                }
              >
                <PropertyMapSingle property={property} />
              </Suspense>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}

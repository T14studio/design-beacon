import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Bed, Bath, Maximize, Car, Check, MessageCircle } from "lucide-react";
import { properties, formatPrice } from "@/data/properties";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

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
      <div className="pt-24 pb-4 px-6">
        <div className="container mx-auto">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} /> ← Voltar
          </button>
        </div>
      </div>

      {/* Gallery */}
      <section className="px-6 pb-8">
        <div className="container mx-auto">
          <div className="relative h-[50vh] md:h-[60vh] rounded-lg overflow-hidden mb-4">
            <img
              src={property.images[selectedImg]}
              alt={property.title}
              className="w-full h-full object-cover transition-all duration-500"
            />
            <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-mono tracking-widest uppercase px-3 py-1.5 rounded-sm">
              {property.mode}
            </span>
          </div>
          <div className="flex gap-3">
            {property.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImg(i)}
                className={`h-20 w-28 rounded-md overflow-hidden border-2 transition-all ${
                  i === selectedImg ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Info */}
      <section className="px-6 pb-16">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main */}
            <div className="lg:col-span-2">
              <ScrollReveal>
                <span className="font-mono text-xs tracking-widest uppercase text-primary block mb-2">
                  {property.type} • {property.neighborhood}, {property.location}
                </span>
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
                  {property.title}
                </h1>
                <p className="text-gold-gradient text-3xl font-bold mb-8">
                  {formatPrice(property.price, property.mode)}
                </p>

                {/* Specs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                  {specs.map((s) => (
                    <div key={s.label} className="bg-card border border-border rounded-lg p-4 text-center">
                      <s.icon size={20} className="mx-auto mb-2 text-primary" />
                      <p className="text-lg font-bold text-foreground">{s.value}</p>
                      <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <h3 className="text-lg font-semibold mb-3">Sobre o imóvel</h3>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  {property.description}
                </p>

                {/* Features */}
                <h3 className="text-lg font-semibold mb-3">Características</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {property.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check size={14} className="text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </ScrollReveal>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <ScrollReveal delay={200}>
                <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
                  <h3 className="text-lg font-semibold mb-1">Interessado?</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Preencha o formulário ou entre em contato diretamente.
                  </p>
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <Input placeholder="Seu nome" className="bg-background" />
                    <Input type="email" placeholder="E-mail" className="bg-background" />
                    <Input type="tel" placeholder="Telefone" className="bg-background" />
                    <Textarea placeholder="Mensagem" rows={3} className="bg-background" />
                    <Button className="w-full bg-gold-gradient text-primary-foreground font-semibold tracking-wide hover:opacity-90 transition-opacity">
                      Enviar mensagem
                    </Button>
                  </form>

                  <div className="mt-4">
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-green-600/50 text-green-500 hover:bg-green-600/10 hover:text-green-400"
                    >
                      <a
                        href={`https://wa.me/5511999999999?text=Olá! Tenho interesse no imóvel: ${property.title}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle size={16} /> WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

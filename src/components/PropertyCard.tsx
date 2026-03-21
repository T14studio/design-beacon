import { Link } from "react-router-dom";
import { Bed, Bath, Maximize, Car } from "lucide-react";
import { type Property, formatPrice } from "@/data/properties";
import { cn } from "@/lib/utils";

interface Props {
  property: Property;
  variant?: "grid" | "featured";
}

export default function PropertyCard({ property, variant = "grid" }: Props) {
  if (variant === "featured") {
    return (
      <Link
        to={`/imoveis/${property.id}`}
        className="group grid grid-cols-1 md:grid-cols-2 gap-0 border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-500 shadow-sm hover:shadow-xl"
      >
        {/* Image */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
          />
          <span className="absolute top-6 left-6 bg-primary text-primary-foreground text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-2 rounded-full shadow-lg">
            {property.mode}
          </span>
        </div>

        {/* Details */}
        <div className="flex flex-col justify-center p-8 md:p-12 bg-card/30 backdrop-blur-sm group-hover:bg-card/50 transition-colors">
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary mb-3 font-semibold">
            {property.type} • {property.neighborhood}
          </span>
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors duration-300 leading-tight">
            {property.title}
          </h3>
          <p className="text-muted-foreground text-sm mb-6 line-clamp-2 leading-relaxed">
            {property.description}
          </p>
          <div className="flex flex-wrap items-center gap-6 text-muted-foreground text-sm mb-8">
            {property.bedrooms > 0 && <span className="flex items-center gap-2"><Bed size={18} className="text-primary/70" /> {property.bedrooms}</span>}
            {property.bathrooms > 0 && <span className="flex items-center gap-2"><Bath size={18} className="text-primary/70" /> {property.bathrooms}</span>}
            <span className="flex items-center gap-2"><Maximize size={18} className="text-primary/70" /> {property.area}m²</span>
            {property.parking > 0 && <span className="flex items-center gap-2"><Car size={18} className="text-primary/70" /> {property.parking}</span>}
          </div>
          {property.type === "Terreno" && property.potential && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-6">
              <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-primary" />
                {property.potential}
              </p>
            </div>
          )}
          <p className="text-gold-gradient text-3xl font-bold tracking-tight">
            {formatPrice(property.price, property.mode)}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/imoveis/${property.id}`}
      className="group block border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-500 shadow-sm hover:shadow-xl bg-card/20"
    >
      <div className="relative h-60 overflow-hidden">
        <img
          src={property.images[0]}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
        />
        <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-[9px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full shadow-lg">
          {property.mode}
        </span>
      </div>
      <div className="p-6">
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-primary font-bold">
          {property.type} • {property.neighborhood}
        </span>
        <h3 className="text-lg font-bold text-foreground mt-2 mb-3 group-hover:text-primary transition-colors line-clamp-1">
          {property.title}
        </h3>
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-xs mb-4">
          {property.bedrooms > 0 && <span className="flex items-center gap-1.5"><Bed size={14} className="text-primary/70" /> {property.bedrooms}</span>}
          {property.bathrooms > 0 && <span className="flex items-center gap-1.5"><Bath size={14} className="text-primary/70" /> {property.bathrooms}</span>}
          <span className="flex items-center gap-1.5"><Maximize size={14} className="text-primary/70" /> {property.area}m²</span>
          {property.parking > 0 && <span className="flex items-center gap-1.5"><Car size={14} className="text-primary/70" /> {property.parking}</span>}
        </div>
        {property.type === "Terreno" && property.potential && (
          <p className="text-[10px] text-muted-foreground/80 italic mb-4 line-clamp-1 border-l-2 border-primary/30 pl-2">
            {property.potential}
          </p>
        )}
        <p className="text-gold-gradient text-xl font-bold tracking-tight">
          {formatPrice(property.price, property.mode)}
        </p>
      </div>
    </Link>
  );
}

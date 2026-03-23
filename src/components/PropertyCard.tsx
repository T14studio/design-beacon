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
        className="group grid grid-cols-1 md:grid-cols-2 gap-0 border border-border rounded-xl sm:rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-500 shadow-sm hover:shadow-xl"
      >
        {/* Image */}
        <div className="relative h-52 sm:h-64 md:h-80 overflow-hidden">
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
          />
          <span className="absolute top-4 sm:top-6 left-4 sm:left-6 bg-primary text-primary-foreground text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg">
            {property.mode}
          </span>
        </div>

        {/* Details */}
        <div className="flex flex-col justify-center p-5 sm:p-8 md:p-10 lg:p-12 bg-card/30 backdrop-blur-sm group-hover:bg-card/50 transition-colors">
          <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] uppercase text-primary mb-2 sm:mb-3 font-semibold">
            {property.type} • {property.neighborhood}
          </span>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4 group-hover:text-primary transition-colors duration-300 leading-tight">
            {property.title}
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6 line-clamp-2 leading-relaxed">
            {property.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-6 text-muted-foreground text-xs sm:text-sm mb-5 sm:mb-8">
            {property.bedrooms > 0 && <span className="flex items-center gap-1.5 sm:gap-2"><Bed size={16} className="text-primary/70" /> {property.bedrooms}</span>}
            {property.bathrooms > 0 && <span className="flex items-center gap-1.5 sm:gap-2"><Bath size={16} className="text-primary/70" /> {property.bathrooms}</span>}
            <span className="flex items-center gap-1.5 sm:gap-2"><Maximize size={16} className="text-primary/70" /> {property.area}m²</span>
            {property.parking > 0 && <span className="flex items-center gap-1.5 sm:gap-2"><Car size={16} className="text-primary/70" /> {property.parking}</span>}
          </div>
          {property.type === "Terreno" && property.potential && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-2.5 sm:p-3 mb-4 sm:mb-6">
              <p className="text-[10px] sm:text-[11px] text-muted-foreground flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                {property.potential}
              </p>
            </div>
          )}
          <p className="text-gold-gradient text-2xl sm:text-3xl font-bold tracking-tight">
            {formatPrice(property.price, property.mode)}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/imoveis/${property.id}`}
      className="group block border border-border rounded-xl sm:rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-500 shadow-sm hover:shadow-xl bg-card/20"
    >
      <div className="relative h-48 sm:h-60 overflow-hidden">
        <img
          src={property.images[0]}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
        />
        <span className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-primary text-primary-foreground text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-lg">
          {property.mode}
        </span>
      </div>
      <div className="p-4 sm:p-6">
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-primary font-bold">
          {property.type} • {property.neighborhood}
        </span>
        <h3 className="text-base sm:text-lg font-bold text-foreground mt-1.5 sm:mt-2 mb-2 sm:mb-3 group-hover:text-primary transition-colors line-clamp-1">
          {property.title}
        </h3>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-muted-foreground text-xs mb-3 sm:mb-4">
          {property.bedrooms > 0 && <span className="flex items-center gap-1.5"><Bed size={14} className="text-primary/70" /> {property.bedrooms}</span>}
          {property.bathrooms > 0 && <span className="flex items-center gap-1.5"><Bath size={14} className="text-primary/70" /> {property.bathrooms}</span>}
          <span className="flex items-center gap-1.5"><Maximize size={14} className="text-primary/70" /> {property.area}m²</span>
          {property.parking > 0 && <span className="flex items-center gap-1.5"><Car size={14} className="text-primary/70" /> {property.parking}</span>}
        </div>
        {property.type === "Terreno" && property.potential && (
          <p className="text-[10px] text-muted-foreground/80 italic mb-3 sm:mb-4 line-clamp-1 border-l-2 border-primary/30 pl-2">
            {property.potential}
          </p>
        )}
        <p className="text-gold-gradient text-lg sm:text-xl font-bold tracking-tight">
          {formatPrice(property.price, property.mode)}
        </p>
      </div>
    </Link>
  );
}

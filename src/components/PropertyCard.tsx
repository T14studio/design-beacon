import { Link } from "react-router-dom";
import { Bed, Bath, Maximize, Car } from "lucide-react";
import { type Property, formatPrice } from "@/data/properties";

interface Props {
  property: Property;
  variant?: "grid" | "featured";
}

export default function PropertyCard({ property, variant = "grid" }: Props) {
  if (variant === "featured") {
    return (
      <Link
        to={`/imoveis/${property.id}`}
        className="group grid grid-cols-1 md:grid-cols-2 gap-0 border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors duration-500"
      >
        {/* Image */}
        <div className="relative h-56 md:h-80 overflow-hidden">
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
          />
          <span className="absolute top-3 md:top-4 left-3 md:left-4 bg-primary text-primary-foreground text-xs font-mono tracking-widest uppercase px-3 py-1 rounded-sm">
            {property.mode}
          </span>
        </div>

        {/* Details */}
        <div className="flex flex-col justify-center p-6 md:p-12">
          <span className="font-mono text-[10px] md:text-xs tracking-widest uppercase text-primary mb-2">
            {property.type} • {property.neighborhood}
          </span>
          <h3 className="text-lg md:text-2xl font-semibold text-foreground mb-2 md:mb-3 group-hover:text-primary transition-colors duration-300">
            {property.title}
          </h3>
          <p className="text-muted-foreground text-sm mb-4 md:mb-6 line-clamp-2">
            {property.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 md:gap-5 text-muted-foreground text-xs md:text-sm mb-4 md:mb-6">
            {property.bedrooms > 0 && (
              <span className="flex items-center gap-1.5"><Bed size={16} /> {property.bedrooms}</span>
            )}
            <span className="flex items-center gap-1.5"><Bath size={16} /> {property.bathrooms}</span>
            <span className="flex items-center gap-1.5"><Maximize size={16} /> {property.area}m²</span>
            {property.parking > 0 && (
              <span className="flex items-center gap-1.5"><Car size={16} /> {property.parking}</span>
            )}
          </div>
          <p className="text-gold-gradient text-xl md:text-2xl font-bold">
            {formatPrice(property.price, property.mode)}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/imoveis/${property.id}`}
      className="group block border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors duration-500"
    >
      <div className="relative h-48 md:h-56 overflow-hidden">
        <img
          src={property.images[0]}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-mono tracking-widest uppercase px-2.5 py-1 rounded-sm">
          {property.mode}
        </span>
      </div>
      <div className="p-4 md:p-5">
        <span className="font-mono text-[10px] tracking-widest uppercase text-primary">
          {property.type} • {property.neighborhood}
        </span>
        <h3 className="text-sm md:text-base font-semibold text-foreground mt-1 mb-2 group-hover:text-primary transition-colors">
          {property.title}
        </h3>
        <div className="flex flex-wrap items-center gap-3 md:gap-4 text-muted-foreground text-xs mb-3">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1"><Bed size={13} /> {property.bedrooms}</span>
          )}
          <span className="flex items-center gap-1"><Bath size={13} /> {property.bathrooms}</span>
          <span className="flex items-center gap-1"><Maximize size={13} /> {property.area}m²</span>
        </div>
        <p className="text-gold-gradient text-lg font-bold">
          {formatPrice(property.price, property.mode)}
        </p>
      </div>
    </Link>
  );
}

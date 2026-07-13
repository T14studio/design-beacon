import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import { MapPin } from "lucide-react";
import { type Property, formatPrice } from "@/data/properties";
import "leaflet/dist/leaflet.css";

// Gold custom pin — coerente com a identidade visual
const goldIcon = new Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Props {
  property: Property;
}

export default function PropertyMapSingle({ property }: Props) {
  // Fallback elegante para imóveis sem localização confirmada
  if (!property.hasLocation) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-card/30 rounded-2xl border border-border/40 gap-4 px-8 py-10">
        <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <MapPin size={24} className="text-primary/60" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground/80 tracking-tight">
            Localização sob consulta
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1 font-mono uppercase tracking-widest">
            Fale com um especialista
          </p>
        </div>
      </div>
    );
  }

  const center: [number, number] = [property.lat, property.lng];

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border border-border/40 relative">
      {/* Overlay decorativo nos cantos — mantém o estilo premium */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background/30 to-transparent z-[400] pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/30 to-transparent z-[400] pointer-events-none" />

      <MapContainer
        center={center}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        zoomControl={true}
        attributionControl={false}
      >
        {/* CartoDB Dark — mesma tile do mapa global do site */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Marker position={center} icon={goldIcon}>
          <Popup>
            <div className="text-xs min-w-[190px] font-sans">
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-full h-24 object-cover rounded-md mb-3"
              />
              <p className="font-bold text-sm text-gray-900 leading-snug mb-1">
                {property.title}
              </p>
              {property.address && (
                <p className="text-gray-500 text-[11px] mb-1">{property.address}</p>
              )}
              <p className="text-gray-500 text-[11px]">
                {property.neighborhood}, {property.location}
              </p>
              <p className="font-bold text-amber-700 mt-2 text-sm">
                {formatPrice(property.price, property.mode)}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

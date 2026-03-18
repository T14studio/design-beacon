import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import { Link } from "react-router-dom";
import { type Property, formatPrice } from "@/data/properties";
import "leaflet/dist/leaflet.css";

const goldIcon = new Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Props {
  properties: Property[];
  className?: string;
}

export default function PropertyMap({ properties, className = "" }: Props) {
  const center: [number, number] = properties.length > 0
    ? [properties.reduce((s, p) => s + p.lat, 0) / properties.length, properties.reduce((s, p) => s + p.lng, 0) / properties.length]
    : [-23.55, -46.63];

  return (
    <div className={`rounded-lg overflow-hidden border border-border ${className}`}>
      <MapContainer
        center={center}
        zoom={10}
        style={{ height: "100%", width: "100%", minHeight: "400px" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {properties.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={goldIcon}>
            <Popup>
              <div className="text-xs min-w-[180px]">
                <img src={p.images[0]} alt={p.title} className="w-full h-20 object-cover rounded mb-2" />
                <p className="font-semibold text-sm text-gray-900">{p.title}</p>
                <p className="text-gray-600">{p.neighborhood}, {p.location}</p>
                <p className="font-bold text-amber-700 mt-1">{formatPrice(p.price, p.mode)}</p>
                <Link to={`/imoveis/${p.id}`} className="text-blue-600 text-xs mt-1 block hover:underline">
                  Ver detalhes →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";
import property4 from "@/assets/property-4.jpg";
import property5 from "@/assets/property-5.jpg";
import property6 from "@/assets/property-6.jpg";

export type Property = {
  id: string;
  title: string;
  type: "Apartamento" | "Casa" | "Cobertura";
  mode: "Venda" | "Locação";
  price: number;
  location: string;
  neighborhood: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  parking: number;
  description: string;
  features: string[];
  images: string[];
  featured: boolean;
  lat: number;
  lng: number;
};

export const properties: Property[] = [
  {
    id: "penthouse-jardins",
    title: "Cobertura Duplex nos Jardins",
    type: "Cobertura",
    mode: "Venda",
    price: 8500000,
    location: "São Paulo",
    neighborhood: "Jardins",
    bedrooms: 4,
    bathrooms: 6,
    area: 420,
    parking: 4,
    description:
      "Cobertura duplex espetacular com vista panorâmica para a cidade. Acabamentos de alto padrão, piscina privativa no terraço e ampla área gourmet. Localização privilegiada no coração dos Jardins.",
    features: [
      "Piscina privativa",
      "Terraço panorâmico",
      "Área gourmet",
      "Home cinema",
      "Closet planejado",
      "Automação residencial",
      "Lareira ecológica",
      "Piso de mármore importado",
    ],
    images: [property1, property3, property4],
    featured: true,
    lat: -23.5615,
    lng: -46.6589,
  },
  {
    id: "casa-riviera",
    title: "Mansão na Riviera de São Lourenço",
    type: "Casa",
    mode: "Venda",
    price: 12000000,
    location: "Bertioga",
    neighborhood: "Riviera de São Lourenço",
    bedrooms: 6,
    bathrooms: 8,
    area: 850,
    parking: 6,
    description:
      "Residência excepcional em condomínio fechado à beira-mar. Arquitetura contemporânea com integração total aos jardins tropicais e piscina com borda infinita.",
    features: [
      "Piscina com borda infinita",
      "Jardim tropical",
      "Quadra de tênis",
      "Suíte master com closet",
      "Cozinha gourmet",
      "Elevador",
      "Segurança 24h",
      "Acesso direto à praia",
    ],
    images: [property2, property5, property1],
    featured: true,
    lat: -23.7754,
    lng: -46.1305,
  },
  {
    id: "apt-vila-nova",
    title: "Apartamento de Luxo na Vila Nova Conceição",
    type: "Apartamento",
    mode: "Venda",
    price: 5200000,
    location: "São Paulo",
    neighborhood: "Vila Nova Conceição",
    bedrooms: 3,
    bathrooms: 4,
    area: 280,
    parking: 3,
    description:
      "Apartamento sofisticado em edifício boutique com apenas duas unidades por andar. Vista para o Parque Ibirapuera e acabamentos exclusivos.",
    features: [
      "Vista para o Ibirapuera",
      "Varanda gourmet",
      "Piso aquecido",
      "Closet com ilha",
      "Lavabo em ônix",
      "Ar-condicionado central",
    ],
    images: [property4, property6, property3],
    featured: true,
    lat: -23.5870,
    lng: -46.6718,
  },
  {
    id: "cobertura-itaim",
    title: "Cobertura Triplex no Itaim Bibi",
    type: "Cobertura",
    mode: "Venda",
    price: 15000000,
    location: "São Paulo",
    neighborhood: "Itaim Bibi",
    bedrooms: 5,
    bathrooms: 7,
    area: 620,
    parking: 5,
    description:
      "A mais exclusiva cobertura do Itaim Bibi. Três pavimentos com piscina aquecida, spa privativo e heliponto. Projeto assinado por renomado arquiteto.",
    features: [
      "Heliponto",
      "Spa privativo",
      "Piscina aquecida",
      "Adega climatizada",
      "Sala de ginástica",
      "3 suítes com closet",
      "Escritório",
      "Staff completo",
    ],
    images: [property3, property1, property6],
    featured: false,
    lat: -23.5830,
    lng: -46.6790,
  },
  {
    id: "casa-alphaville",
    title: "Casa Contemporânea em Alphaville",
    type: "Casa",
    mode: "Venda",
    price: 6800000,
    location: "Barueri",
    neighborhood: "Alphaville",
    bedrooms: 5,
    bathrooms: 6,
    area: 550,
    parking: 4,
    description:
      "Residência moderna com linhas retas e integração perfeita entre ambientes internos e externos. Amplo terreno arborizado em condomínio de alto padrão.",
    features: [
      "Piscina com deck",
      "Espaço gourmet",
      "Home office",
      "Suíte master com varanda",
      "Jardim planejado",
      "Segurança 24h",
    ],
    images: [property5, property2, property4],
    featured: false,
    lat: -23.4958,
    lng: -46.8502,
  },
  {
    id: "apt-moema",
    title: "Studio de Luxo em Moema",
    type: "Apartamento",
    mode: "Locação",
    price: 8500,
    location: "São Paulo",
    neighborhood: "Moema",
    bedrooms: 1,
    bathrooms: 2,
    area: 75,
    parking: 1,
    description:
      "Studio completamente mobiliado com design autoral. Localização estratégica próxima ao Shopping Ibirapuera e Parque do Povo. Ideal para executivos.",
    features: [
      "Totalmente mobiliado",
      "Varanda",
      "Academia no condomínio",
      "Lavanderia",
      "Portaria 24h",
      "Pet friendly",
    ],
    images: [property6, property4, property1],
    featured: false,
  },
];

export function formatPrice(price: number, mode: "Venda" | "Locação"): string {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
  return mode === "Locação" ? `${formatted}/mês` : formatted;
}

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Loader2 } from "lucide-react";

type Indicator = {
  label: string;
  value: string;
  change: string;
  up: boolean;
};

const FALLBACK_INDICATORS: Indicator[] = [
  { label: "Dólar", value: "R$ 5,12", change: "+0,3%", up: true },
  { label: "Euro", value: "R$ 5,58", change: "-0,1%", up: false },
  { label: "Selic", value: "13,25%", change: "0,0%", up: false },
  { label: "IPCA", value: "4,62%", change: "+0,2%", up: true },
];

async function fetchCurrencyRates(): Promise<Indicator[] | null> {
  try {
    const res = await fetch(
      "https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL"
    );
    if (!res.ok) return null;
    const data = await res.json();

    const usd = data.USDBRL;
    const eur = data.EURBRL;

    if (!usd || !eur) return null;

    const fmtBrl = (v: string) =>
      `R$ ${parseFloat(v).toFixed(2).replace(".", ",")}`;
    const fmtPct = (v: string) => {
      const n = parseFloat(v);
      return `${n >= 0 ? "+" : ""}${n.toFixed(2).replace(".", ",")}%`;
    };

    return [
      {
        label: "Dólar",
        value: fmtBrl(usd.bid),
        change: fmtPct(usd.pctChange),
        up: parseFloat(usd.pctChange) >= 0,
      },
      {
        label: "Euro",
        value: fmtBrl(eur.bid),
        change: fmtPct(eur.pctChange),
        up: parseFloat(eur.pctChange) >= 0,
      },
      FALLBACK_INDICATORS[2], // Selic (no free API, keep static)
      FALLBACK_INDICATORS[3], // IPCA (no free API, keep static)
    ];
  } catch {
    return null;
  }
}

export default function MarketIndicators() {
  const [indicators, setIndicators] = useState<Indicator[]>(FALLBACK_INDICATORS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrencyRates().then((data) => {
      if (data) setIndicators(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <DollarSign size={18} className="text-primary" />
        <h3 className="text-sm font-semibold tracking-wide">Indicadores de Mercado</h3>
        {loading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {indicators.map((ind) => (
          <div key={ind.label} className="bg-background border border-border rounded-lg p-3 text-center">
            <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1">
              {ind.label}
            </p>
            <p className="text-sm md:text-base font-bold text-foreground">{ind.value}</p>
            <div className={`flex items-center justify-center gap-1 text-xs mt-1 ${ind.up ? "text-green-500" : "text-red-400"}`}>
              {ind.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {ind.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

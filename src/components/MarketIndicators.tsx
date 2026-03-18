import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

// Static indicators (could be replaced with API calls)
const indicators = [
  { label: "Dólar", symbol: "USD", value: "R$ 5,12", change: "+0,3%", up: true },
  { label: "Euro", symbol: "EUR", value: "R$ 5,58", change: "-0,1%", up: false },
  { label: "Selic", symbol: "%", value: "13,25%", change: "0,0%", up: false },
  { label: "IPCA", symbol: "%", value: "4,62%", change: "+0,2%", up: true },
];

export default function MarketIndicators() {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <DollarSign size={18} className="text-primary" />
        <h3 className="text-sm font-semibold tracking-wide">Indicadores de Mercado</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {indicators.map((ind) => (
          <div key={ind.label} className="bg-background border border-border rounded-lg p-3 text-center">
            <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1">
              {ind.label}
            </p>
            <p className="text-base font-bold text-foreground">{ind.value}</p>
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

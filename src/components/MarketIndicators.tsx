import { TrendingUp, TrendingDown, DollarSign, Euro, Percent, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";

interface Indicator {
  label: string;
  symbol: string;
  value: string;
  change: string;
  up: boolean;
  icon: any;
}

const FALLBACK_INDICATORS: Indicator[] = [
  { label: "Dólar", symbol: "USD", value: "R$ 5,00", change: "...", up: true, icon: DollarSign },
  { label: "Euro", symbol: "EUR", value: "R$ 5,45", change: "...", up: true, icon: Euro },
  { label: "Selic", symbol: "%", value: "10,50%", change: "0,0%", up: false, icon: Percent },
  { label: "IPCA", symbol: "%", value: "4,42%", change: "+0,1%", up: true, icon: BarChart3 },
];

export default function MarketIndicators() {
  const [indicators, setIndicators] = useState<Indicator[]>(FALLBACK_INDICATORS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL");
        const data = await response.json();
        
        if (data.USDBRL && data.EURBRL) {
          setIndicators(prev => [
            { 
              ...prev[0], 
              value: `R$ ${parseFloat(data.USDBRL.bid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              change: `${parseFloat(data.USDBRL.pctChange) > 0 ? "+" : ""}${data.USDBRL.pctChange}%`,
              up: parseFloat(data.USDBRL.pctChange) > 0
            },
            { 
              ...prev[1], 
              value: `R$ ${parseFloat(data.EURBRL.bid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              change: `${parseFloat(data.EURBRL.pctChange) > 0 ? "+" : ""}${data.EURBRL.pctChange}%`,
              up: parseFloat(data.EURBRL.pctChange) > 0
            },
            ...prev.slice(2)
          ]);
        }
      } catch (error) {
        console.error("Erro ao buscar indicadores:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencies();
    const interval = setInterval(fetchCurrencies, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden relative group">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
      
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
             <BarChart3 size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">Indicadores Econômicos</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-mono mt-0.5">Atualização em tempo real</p>
          </div>
        </div>
        {!loading && (
          <span className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-widest text-primary/60 bg-primary/5 px-3 py-1 rounded-full animate-pulse border border-primary/10">
             Live Data
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {indicators.map((ind, i) => (
          <div 
            key={ind.label} 
            className="bg-background/40 border border-white/5 rounded-3xl p-6 transition-all duration-500 hover:scale-[1.03] hover:border-primary/20 hover:bg-background/60 group/card relative overflow-hidden"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] scale-150 rotate-12 group-hover/card:scale-175 transition-transform duration-700 text-primary">
              <ind.icon size={48} />
            </div>
            
            <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/60 mb-2 font-bold decoration-primary/30 underline-offset-4 decoration-1">
              {ind.label}
            </p>
            
            <div className="flex items-end gap-2 mb-3">
               <p className="text-2xl font-bold text-foreground drop-shadow-sm">{ind.value}</p>
               <span className="text-[10px] text-muted-foreground font-light pb-1">{ind.symbol}</span>
            </div>

            <div className={`flex items-center gap-1.5 text-[11px] font-bold ${ind.up ? "text-green-500" : "text-red-400"}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${ind.up ? "bg-green-500/30" : "bg-red-400/30"} flex items-center justify-center`}>
                 <div className={`w-0.5 h-0.5 rounded-full ${ind.up ? "bg-green-500" : "bg-red-400"}`} />
              </div>
              {ind.change}
              {ind.up ? <TrendingUp size={12} className="ml-1" /> : <TrendingDown size={12} className="ml-1" />}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
         <p className="text-[9px] text-muted-foreground/50 italic">Fonte: AwesomeAPI / Banco Central do Brasil</p>
         <div className="flex gap-2">
            <div className="w-1 h-1 bg-primary/40 rounded-full" />
            <div className="w-1 h-1 bg-primary/20 rounded-full" />
            <div className="w-1 h-1 bg-primary/10 rounded-full" />
         </div>
      </div>
    </div>
  );
}

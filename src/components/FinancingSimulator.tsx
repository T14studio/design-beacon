import { useState, useMemo } from "react";
import { Calculator, ArrowDownUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { calculateFinancing, formatCurrency } from "@/lib/financing";
import type { BankConfig, AmortizationSystem } from "@/data/banks";

interface FinancingSimulatorProps {
  /** Banco selecionado atualmente (opcional — usa defaults se não fornecido) */
  bank?: BankConfig;
}

export default function FinancingSimulator({ bank }: FinancingSimulatorProps) {
  const [propertyValue, setPropertyValue] = useState(1000000);
  const [downPayment, setDownPayment] = useState(200000);
  const [years, setYears] = useState(bank?.maxYears ?? 30);
  const [amortization, setAmortization] = useState<AmortizationSystem>("SAC");

  // Taxa vinda do banco selecionado ou default
  const rate = bank?.annualRate ?? 10.5;
  const maxYears = bank?.maxYears ?? 35;
  const minDownPercent = bank?.minDownPaymentPercent ?? 20;
  const minDown = Math.ceil(propertyValue * minDownPercent / 100);
  const supportedSystems = bank?.amortizationSystems ?? ["SAC", "PRICE"];

  // Se o banco selecionado não suporta o sistema atual, trocar
  const effectiveAmortization = supportedSystems.includes(amortization) ? amortization : supportedSystems[0];

  // Garantir que o prazo não exceda o máximo do banco
  const effectiveYears = Math.min(years, maxYears);

  const result = useMemo(() => {
    return calculateFinancing({
      propertyValue,
      downPayment: Math.max(downPayment, minDown),
      years: effectiveYears,
      annualRate: rate,
      amortizationSystem: effectiveAmortization,
    });
  }, [propertyValue, downPayment, effectiveYears, rate, effectiveAmortization, minDown]);

  const fmt = formatCurrency;

  return (
    <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl md:rounded-[2rem] p-5 sm:p-8 md:p-10 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
          <Calculator size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-center sm:text-left">Simulador de Financiamento</h3>
        </div>

        {/* Seletor de sistema de amortização */}
        {supportedSystems.length > 1 && (
          <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
            <ArrowDownUp size={14} className="text-muted-foreground hidden sm:block" />
            <div className="flex gap-1.5 sm:gap-1 bg-background/80 rounded-full p-1.5 border border-border/50 shadow-inner w-full sm:w-auto">
              {supportedSystems.map((sys) => (
                <button
                  key={sys}
                  onClick={() => setAmortization(sys)}
                  className={`flex-1 sm:flex-none text-[10px] sm:text-[11px] font-mono font-bold tracking-widest uppercase px-2 sm:px-6 py-3 sm:py-2 rounded-full transition-all duration-300 ${
                    effectiveAmortization === sys
                      ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md scale-[1.02]"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {sys}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-2 block">
            Valor do imóvel
          </label>
          <Input
            type="text"
            value={fmt(propertyValue)}
            onChange={(e) => {
              const num = Number(e.target.value.replace(/\D/g, ""));
              if (!isNaN(num)) setPropertyValue(num);
            }}
            className="bg-background"
          />
          <Slider
            value={[propertyValue]}
            onValueChange={([v]) => setPropertyValue(v)}
            min={100000}
            max={30000000}
            step={50000}
            className="mt-3"
          />
        </div>

        <div>
          <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-2 block">
            Entrada {bank ? `(mín. ${minDownPercent}%)` : ""}
          </label>
          <Input
            type="text"
            value={fmt(Math.max(downPayment, minDown))}
            onChange={(e) => {
              const num = Number(e.target.value.replace(/\D/g, ""));
              if (!isNaN(num)) setDownPayment(num);
            }}
            className="bg-background"
          />
          <Slider
            value={[Math.max(downPayment, minDown)]}
            onValueChange={([v]) => setDownPayment(v)}
            min={minDown}
            max={propertyValue * 0.8}
            step={10000}
            className="mt-3"
          />
        </div>

        <div>
          <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-2 block">
            Prazo (anos): {effectiveYears}
          </label>
          <Slider
            value={[effectiveYears]}
            onValueChange={([v]) => setYears(v)}
            min={5}
            max={maxYears}
            step={1}
            className="mt-3"
          />
        </div>

        <div>
          <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-2 block">
            Taxa anual (%): {rate.toFixed(1)}%
            {bank && (
              <span className="text-primary/60 ml-2">({bank.shortName})</span>
            )}
          </label>
          <div className="mt-3 bg-background/40 rounded-lg p-3 border border-border/30">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">Taxa definida pelo banco</span>
              <span className="text-sm font-bold text-foreground">{rate.toFixed(2)}% a.a.</span>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className="mt-8">
          {/* Resultado principal */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            <div className="bg-background/60 backdrop-blur-md border border-border/40 rounded-xl p-3 sm:p-4 text-center shadow-md overflow-hidden flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1 leading-tight truncate">
                {effectiveAmortization === "SAC" ? "1ª Parcela" : "Parcela mensal"}
              </p>
              <p className="text-[11px] xs:text-xs sm:text-base md:text-lg font-bold text-gold-gradient truncate">{fmt(result.monthlyPayment)}</p>
            </div>
            <div className="bg-background/60 backdrop-blur-md border border-border/40 rounded-xl p-3 sm:p-4 text-center shadow-md overflow-hidden flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1 leading-tight truncate">Valor financiado</p>
              <p className="text-[11px] xs:text-xs sm:text-base md:text-lg font-bold text-foreground truncate">{fmt(result.financed)}</p>
            </div>
            <div className="bg-background/60 backdrop-blur-md border border-border/40 rounded-xl p-3 sm:p-4 text-center shadow-md overflow-hidden flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1 leading-tight truncate">Total pago</p>
              <p className="text-[11px] xs:text-xs sm:text-base md:text-lg font-bold text-foreground truncate">{fmt(result.totalPaid)}</p>
            </div>
            <div className="bg-background/60 backdrop-blur-md border border-border/40 rounded-xl p-3 sm:p-4 text-center shadow-md overflow-hidden flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1 leading-tight truncate">Total juros</p>
              <p className="text-[11px] xs:text-xs sm:text-base md:text-lg font-bold text-destructive truncate">{fmt(result.totalInterest)}</p>
            </div>
          </div>

          {/* Info adicional SAC */}
          {effectiveAmortization === "SAC" && (
            <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="bg-background/40 border border-border/30 rounded-lg px-4 py-2.5 flex-1 flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Última parcela</span>
                <span className="text-sm font-bold text-green-400">{fmt(result.lastPayment)}</span>
              </div>
              <div className="bg-background/40 border border-border/30 rounded-lg px-4 py-2.5 flex-1 flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Nº parcelas</span>
                <span className="text-sm font-bold text-foreground">{result.totalInstallments}×</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

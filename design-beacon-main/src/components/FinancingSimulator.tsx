import { useState, useMemo } from "react";
import { Calculator, ArrowDownUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { calculateFinancing, formatCurrency } from "@/lib/financing";
import type { BankConfig, AmortizationSystem, FinancingProgram } from "@/data/banks";
import type { Property } from "@/data/properties";
import { getBackendBaseUrl } from "@/lib/api";
import { toast } from "sonner";

interface FinancingSimulatorProps {
  /** Banco selecionado atualmente (opcional — usa defaults se não fornecido) */
  bank?: BankConfig;
  /** Propriedade vinculada à simulação (se houver) */
  initialProperty?: Property;
  /** Programas/modalidades recebidos do backend */
  programs?: FinancingProgram[];
}

export default function FinancingSimulator({ bank, initialProperty, programs = [] }: FinancingSimulatorProps) {
  const [propertyValue, setPropertyValue] = useState(initialProperty?.price ?? 1000000);
  const [downPayment, setDownPayment] = useState(initialProperty?.price ? Math.ceil(initialProperty.price * (bank?.minDownPaymentPercent ?? 20) / 100) : 200000);
  const [years, setYears] = useState(bank?.maxYears ?? 30);
  const [amortization, setAmortization] = useState<AmortizationSystem>("SAC");
  const [programId, setProgramId] = useState<string>(programs[0]?.id ?? "convencional");
  const [simulationResult, setSimulationResult] = useState<ReturnType<typeof calculateFinancing> | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

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

  const computedResult = useMemo(() => {
    return calculateFinancing({
      propertyValue,
      downPayment: Math.max(downPayment, minDown),
      years: effectiveYears,
      annualRate: rate,
      amortizationSystem: effectiveAmortization,
    });
  }, [propertyValue, downPayment, effectiveYears, rate, effectiveAmortization, minDown]);

  const handleSimulate = () => {
    void (async () => {
      if (!bank) {
        setSimulationResult(computedResult);
        return;
      }
      setIsSimulating(true);
      try {
        const backendBase = getBackendBaseUrl();
        const response = await fetch(`${backendBase}/finance/simulate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bank_id: bank.id,
            program_id: programId,
            amortization_system: effectiveAmortization,
            property_value: propertyValue,
            down_payment: Math.max(downPayment, minDown),
            years: effectiveYears,
          }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err?.detail || `Falha ao simular (${response.status})`);
        }
        const data = await response.json();
        setSimulationResult({
          financed: data.financed_value,
          monthlyPayment: data.monthly_payment,
          lastPayment: data.last_payment,
          totalPaid: data.total_paid,
          totalInterest: data.total_interest,
          totalInstallments: data.months,
          system: data.amortization_system,
        });
      } catch (error: any) {
        toast.error(error?.message || "Não foi possível simular no backend.");
        setSimulationResult(computedResult);
      } finally {
        setIsSimulating(false);
      }
    })();
  };

  const fmt = formatCurrency;

  return (
    <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl md:rounded-[2rem] p-5 sm:p-8 md:p-10 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
          <Calculator size={20} className="text-primary" />
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="text-lg font-semibold text-center sm:text-left">Simulador de Financiamento</h3>
            {initialProperty && (
              <span className="text-[10px] uppercase font-mono tracking-widest text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full mt-1">
                Simulação para este imóvel
              </span>
            )}
          </div>
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
            Programa / Modalidade
          </label>
          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm"
          >
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            {programs.length === 0 && <option value="convencional">Convencional</option>}
          </select>
        </div>

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
          <div className="mt-3 bg-background/40 rounded-lg p-3 border border-border/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">Taxa definida pelo banco</span>
              <span className="text-sm font-bold text-foreground">{rate.toFixed(2)}% a.a.</span>
            </div>
            {programs && programs.length > 0 && (
              <div className="flex items-start justify-between gap-2 mt-2 pt-2 border-t border-border/10">
                <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60 shrink-0">Opções Disponíveis</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {programs.map((p) => (
                    <span key={p.id} className="text-[9px] font-mono font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full border border-primary/20">
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botão de Simulação */}
      <div className="mt-10 flex justify-center border-t border-border/20 pt-8">
        <Button onClick={handleSimulate} disabled={isSimulating} className="bg-gold-gradient text-primary-foreground font-bold px-6 sm:px-12 h-12 sm:h-14 md:h-16 rounded-full hover:opacity-90 transition-all shadow-xl btn-shine uppercase tracking-widest text-[10px] sm:text-[11px] w-[280px] max-w-full sm:w-auto">
          {isSimulating ? "Simulando..." : "Simular agora"}
        </Button>
      </div>

      {simulationResult && (
        <div className="mt-10 pt-8 border-t border-border/40 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-6 flex flex-col items-center justify-center">
             <h4 className="text-sm font-bold uppercase tracking-widest text-primary mb-2">Resultado da Simulação</h4>
             {initialProperty && (
               <p className="text-xs text-muted-foreground font-mono bg-background/50 px-3 py-1 rounded-full border border-border/30">
                 Imóvel: <span className="font-bold text-foreground">{initialProperty.title}</span>
               </p>
             )}
             {bank && (
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2 flex items-center gap-2">
                 Banco: <span className="font-bold text-foreground">{bank.name}</span> | Taxa: <span className="font-bold text-foreground">{rate.toFixed(1)}% a.a.</span> | Amor.: <span className="font-bold text-foreground">{effectiveAmortization}</span>
               </p>
             )}
          </div>

          {/* Resultado principal */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            <div className="bg-background/60 backdrop-blur-md border border-border/40 rounded-xl p-3 sm:p-4 text-center shadow-md overflow-hidden flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1 leading-tight truncate">
                {effectiveAmortization === "SAC" ? "1ª Parcela" : "Parcela mensal"}
              </p>
              <p className="text-[11px] xs:text-xs sm:text-base md:text-lg font-bold text-gold-gradient truncate">{fmt(simulationResult.monthlyPayment)}</p>
            </div>
            <div className="bg-background/60 backdrop-blur-md border border-border/40 rounded-xl p-3 sm:p-4 text-center shadow-md overflow-hidden flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1 leading-tight truncate">Valor do Imóvel</p>
              <p className="text-[11px] xs:text-xs sm:text-base md:text-lg font-bold text-foreground truncate">{fmt(propertyValue)}</p>
            </div>
            <div className="bg-background/60 backdrop-blur-md border border-border/40 rounded-xl p-3 sm:p-4 text-center shadow-md overflow-hidden flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1 leading-tight truncate">Total Entrada</p>
              <p className="text-[11px] xs:text-xs sm:text-base md:text-lg font-bold text-foreground truncate">{fmt(downPayment)}</p>
            </div>
            <div className="bg-background/60 backdrop-blur-md border border-border/40 rounded-xl p-3 sm:p-4 text-center shadow-md overflow-hidden flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1 leading-tight truncate">Valor financiado</p>
              <p className="text-[11px] xs:text-xs sm:text-base md:text-lg font-bold text-foreground truncate">{fmt(simulationResult.financed)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5 mt-4">
            <div className="bg-background/60 backdrop-blur-md border border-border/40 rounded-xl p-3 sm:p-4 text-center shadow-md overflow-hidden flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1 leading-tight truncate">Total pago estimado</p>
              <p className="text-[11px] xs:text-xs sm:text-base md:text-lg font-bold text-foreground truncate">{fmt(simulationResult.totalPaid)}</p>
            </div>
            <div className="bg-background/60 backdrop-blur-md border border-border/40 rounded-xl p-3 sm:p-4 text-center shadow-md overflow-hidden flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1 leading-tight truncate">Total juros</p>
              <p className="text-[11px] xs:text-xs sm:text-base md:text-lg font-bold text-destructive truncate">{fmt(simulationResult.totalInterest)}</p>
            </div>
          </div>

          {/* Info adicional SAC */}
          {effectiveAmortization === "SAC" && (
            <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="bg-background/40 border border-border/30 rounded-lg px-4 py-2.5 flex-1 flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Última parcela</span>
                <span className="text-sm font-bold text-green-400">{fmt(simulationResult.lastPayment)}</span>
              </div>
              <div className="bg-background/40 border border-border/30 rounded-lg px-4 py-2.5 flex-1 flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Nº parcelas (prazo {effectiveYears} anos)</span>
                <span className="text-sm font-bold text-foreground">{simulationResult.totalInstallments}×</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

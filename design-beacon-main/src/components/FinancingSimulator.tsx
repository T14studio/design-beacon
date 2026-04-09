import { useState, useMemo, useEffect } from "react";
import { Calculator, ArrowDownUp, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { calculateFinancing, formatCurrency } from "@/lib/financing";
import type { BankConfig, AmortizationSystem, FinancingProgram } from "@/data/banks";
import type { Property } from "@/data/properties";
import { getBackendBaseUrl } from "@/lib/api";
import { toast } from "sonner";

interface FinancingSimulatorProps {
  bank?: BankConfig;
  initialProperty?: Property;
  programs?: FinancingProgram[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Programas de fallback — usados quando o backend não está disponível.
// Espelham exatamente os _PROGRAMS do finance_service.py.
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_PROGRAMS: FinancingProgram[] = [
  {
    id: "convencional",
    name: "Convencional",
    description: "Financiamento imobiliário padrão de mercado. Sem restrições de renda ou valor do imóvel.",
    max_financing_percent: 80,
    min_down_payment_percent: 20,
    max_years: 35,
    rate_discount_annual: 0,
    applicable_modalities: ["aquisicao_imovel_novo", "aquisicao_imovel_usado"],
  },
  {
    id: "mcmv_faixa_1",
    name: "MCMV — Faixa 1",
    description: "Minha Casa Minha Vida Faixa 1. Renda até R$ 2.640/mês. Teto R$ 190.000.",
    max_financing_percent: 90,
    min_down_payment_percent: 10,
    max_years: 35,
    rate_discount_annual: 1.5,
    applicable_modalities: ["aquisicao_imovel_novo"],
  },
  {
    id: "mcmv_faixa_2",
    name: "MCMV — Faixa 2",
    description: "Minha Casa Minha Vida Faixa 2. Renda R$ 2.640–4.400/mês. Teto R$ 264.000.",
    max_financing_percent: 85,
    min_down_payment_percent: 15,
    max_years: 35,
    rate_discount_annual: 1.0,
    applicable_modalities: ["aquisicao_imovel_novo", "aquisicao_imovel_usado"],
  },
  {
    id: "mcmv_faixa_3",
    name: "MCMV — Faixa 3",
    description: "Minha Casa Minha Vida Faixa 3. Renda R$ 4.400–8.000/mês. Teto R$ 350.000.",
    max_financing_percent: 80,
    min_down_payment_percent: 20,
    max_years: 35,
    rate_discount_annual: 0.5,
    applicable_modalities: ["aquisicao_imovel_novo", "aquisicao_imovel_usado"],
  },
];

// Tetos de valor por programa (espelham max_property_value do backend)
const PROGRAM_MAX_PROPERTY: Record<string, number | null> = {
  convencional: null,
  mcmv_faixa_1: 190000,
  mcmv_faixa_2: 264000,
  mcmv_faixa_3: 350000,
};

// Bancos elegíveis por programa (espelham eligible_bank_ids do backend)
const PROGRAM_ELIGIBLE_BANKS: Record<string, string[] | null> = {
  convencional: null,
  mcmv_faixa_1: ["caixa", "bb"],
  mcmv_faixa_2: ["caixa", "bb", "bradesco", "santander"],
  mcmv_faixa_3: ["caixa", "bb", "bradesco", "santander", "itau"],
};

export default function FinancingSimulator({
  bank,
  initialProperty,
  programs: programsProp = [],
}: FinancingSimulatorProps) {
  // Usa os programas recebidos via prop; se vazio, usa fallback local
  const programs = programsProp.length > 0 ? programsProp : FALLBACK_PROGRAMS;

  const [propertyValue, setPropertyValue] = useState(
    initialProperty?.price ?? 1_000_000
  );
  const [years, setYears] = useState(bank?.maxYears ?? 30);
  const [amortization, setAmortization] = useState<AmortizationSystem>("SAC");
  const [programId, setProgramId] = useState<string>(programs[0]?.id ?? "convencional");
  const [simulationResult, setSimulationResult] = useState<ReturnType<typeof calculateFinancing>>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string | null>(null);

  // ── Programa selecionado ───────────────────────────────────────────────────
  const selectedProgram = useMemo(
    () => programs.find((p) => p.id === programId) ?? programs[0],
    [programs, programId]
  );

  // ── Regras combinadas banco + programa ────────────────────────────────────
  const bankAnnualRate  = bank?.annualRate ?? 10.5;
  const programDiscount = selectedProgram?.rate_discount_annual ?? 0;
  const effectiveRate   = Math.max(bankAnnualRate - programDiscount, 0.01);

  const bankMaxYears     = bank?.maxYears ?? 35;
  const programMaxYears  = selectedProgram?.max_years ?? 35;
  const maxYears         = Math.min(bankMaxYears, programMaxYears);
  const effectiveYears   = Math.min(years, maxYears);

  const bankMinDown      = bank?.minDownPaymentPercent ?? 20;
  const programMinDown   = selectedProgram?.min_down_payment_percent ?? 20;
  const minDownPercent   = Math.max(bankMinDown, programMinDown);
  const minDown          = Math.ceil(propertyValue * minDownPercent / 100);

  // Teto do imóvel para o programa
  const maxPropertyForProgram = PROGRAM_MAX_PROPERTY[programId] ?? null;

  // Elegibilidade: banco atual elegível para o programa?
  const eligibleBanks    = PROGRAM_ELIGIBLE_BANKS[programId] ?? null;
  const bankEligible     = eligibleBanks === null || (bank ? eligibleBanks.includes(bank.id) : true);

  // Sistemas de amortização suportados
  const supportedSystems = bank?.amortizationSystems ?? (["SAC", "PRICE"] as AmortizationSystem[]);
  const effectiveAmortization: AmortizationSystem = supportedSystems.includes(amortization)
    ? amortization
    : supportedSystems[0];

  // Entrada derivada do mínimo do programa
  const [downPayment, setDownPayment] = useState(
    initialProperty?.price
      ? Math.ceil(initialProperty.price * minDownPercent / 100)
      : minDown
  );

  // Quando muda o banco ou o programa, forçar entrada mínima coerente
  useEffect(() => {
    setDownPayment((prev) => Math.max(prev, minDown));
  }, [minDown]);

  // Limitar prazo quando maxYears muda
  useEffect(() => {
    setYears((prev) => Math.min(prev, maxYears));
  }, [maxYears]);

  // ── Resultado local (calculado imediatamente para feedback) ───────────────
  const localResult = useMemo(() => {
    if (!bankEligible) return null;
    const effDown = Math.max(downPayment, minDown);
    const capped  = maxPropertyForProgram
      ? Math.min(propertyValue, maxPropertyForProgram)
      : propertyValue;
    return calculateFinancing({
      propertyValue: capped,
      downPayment: effDown,
      years: effectiveYears,
      annualRate: effectiveRate,
      amortizationSystem: effectiveAmortization,
    });
  }, [
    bankEligible, downPayment, minDown, propertyValue, maxPropertyForProgram,
    effectiveYears, effectiveRate, effectiveAmortization,
  ]);

  // ── Simulação com backend ──────────────────────────────────────────────────
  const handleSimulate = () => {
    void (async () => {
      setBackendError(null);

      if (!bank) {
        setSimulationResult(localResult);
        return;
      }

      if (!bankEligible) {
        const eligible = eligibleBanks?.join(", ") ?? "";
        toast.error(
          `O banco selecionado não opera o programa "${selectedProgram?.name}". Elegíveis: ${eligible}.`
        );
        return;
      }

      setIsSimulating(true);
      try {
        const base     = getBackendBaseUrl();
        const effDown  = Math.max(downPayment, minDown);
        const body     = {
          bank_id:            bank.id,
          program_id:         programId,
          amortization_system: effectiveAmortization,
          property_value:     propertyValue,
          down_payment:       effDown,
          years:              effectiveYears,
        };

        const response = await fetch(`${base}/finance/simulate`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err?.detail ?? `Erro ${response.status}`);
        }

        const data = await response.json();
        setDataSource(data.data_source ?? null);
        setSimulationResult({
          financed:          data.financed_value,
          monthlyPayment:    data.monthly_payment,
          lastPayment:       data.last_payment,
          totalPaid:         data.total_paid,
          totalInterest:     data.total_interest,
          totalInstallments: data.months,
          system:            data.amortization_system as AmortizationSystem,
        });
      } catch (err: any) {
        const msg = err?.message ?? "Não foi possível conectar ao backend.";
        setBackendError(msg);
        toast.error(msg);
        // Fallback para cálculo local
        setSimulationResult(localResult);
      } finally {
        setIsSimulating(false);
      }
    })();
  };

  const fmt = formatCurrency;

  return (
    <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl md:rounded-[2rem] p-5 sm:p-8 md:p-10 shadow-2xl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
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

        {/* Seletor SAC / PRICE */}
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

      {/* ── Formulário ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Programa / Modalidade */}
        <div className="md:col-span-2">
          <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-2 block">
            Programa / Modalidade
          </label>
          <select
            value={programId}
            onChange={(e) => {
              setProgramId(e.target.value);
              setSimulationResult(null);
              setBackendError(null);
            }}
            className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Regras do programa selecionado */}
          {selectedProgram && (
            <div className="mt-2 flex flex-wrap gap-2 items-center">
              <span className="text-[9px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                Entrada mín. {selectedProgram.min_down_payment_percent}%
              </span>
              <span className="text-[9px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                Fin. máx. {selectedProgram.max_financing_percent}%
              </span>
              {selectedProgram.rate_discount_annual > 0 && (
                <span className="text-[9px] font-mono bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                  −{selectedProgram.rate_discount_annual}% a.a. de desconto
                </span>
              )}
              {maxPropertyForProgram && (
                <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Imóvel até {fmt(maxPropertyForProgram)}
                </span>
              )}
            </div>
          )}

          {/* Aviso de inelegibilidade */}
          {bank && !bankEligible && (
            <div className="mt-2 flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
              <AlertCircle size={14} className="text-destructive shrink-0 mt-0.5" />
              <p className="text-[10px] text-destructive leading-relaxed">
                <strong>{bank.name}</strong> não opera o programa <strong>{selectedProgram?.name}</strong>.
                {eligibleBanks && ` Elegíveis: ${eligibleBanks.join(", ")}.`}
              </p>
            </div>
          )}
        </div>

        {/* Valor do imóvel */}
        <div>
          <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-2 block">
            Valor do imóvel
            {maxPropertyForProgram && propertyValue > maxPropertyForProgram && (
              <span className="ml-2 text-amber-400">(excede teto do programa)</span>
            )}
          </label>
          <Input
            type="text"
            value={fmt(propertyValue)}
            onChange={(e) => {
              const num = Number(e.target.value.replace(/\D/g, ""));
              if (!isNaN(num)) { setPropertyValue(num); setSimulationResult(null); }
            }}
            className={`bg-background ${
              maxPropertyForProgram && propertyValue > maxPropertyForProgram
                ? "border-amber-500/50 focus-visible:ring-amber-500/20"
                : ""
            }`}
          />
          <Slider
            value={[propertyValue]}
            onValueChange={([v]) => { setPropertyValue(v); setSimulationResult(null); }}
            min={50000}
            max={maxPropertyForProgram ? Math.max(maxPropertyForProgram * 1.5, 5_000_000) : 30_000_000}
            step={10000}
            className="mt-3"
          />
        </div>

        {/* Entrada */}
        <div>
          <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-2 block">
            Entrada {`(mín. ${minDownPercent}% = ${fmt(minDown)})`}
          </label>
          <Input
            type="text"
            value={fmt(Math.max(downPayment, minDown))}
            onChange={(e) => {
              const num = Number(e.target.value.replace(/\D/g, ""));
              if (!isNaN(num)) { setDownPayment(num); setSimulationResult(null); }
            }}
            className="bg-background"
          />
          <Slider
            value={[Math.max(downPayment, minDown)]}
            onValueChange={([v]) => { setDownPayment(v); setSimulationResult(null); }}
            min={minDown}
            max={Math.floor(propertyValue * 0.9)}
            step={5000}
            className="mt-3"
          />
        </div>

        {/* Prazo */}
        <div>
          <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-2 block">
            Prazo (anos): {effectiveYears}
            {effectiveYears < years && (
              <span className="ml-2 text-amber-400">(ajustado ao máx. do programa)</span>
            )}
          </label>
          <Slider
            value={[effectiveYears]}
            onValueChange={([v]) => { setYears(v); setSimulationResult(null); }}
            min={5}
            max={maxYears}
            step={1}
            className="mt-3"
          />
        </div>

        {/* Taxa efetiva */}
        <div>
          <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-2 block">
            Taxa efetiva
            {bank && <span className="text-primary/60 ml-2">({bank.shortName})</span>}
          </label>
          <div className="mt-3 bg-background/40 rounded-lg p-3 border border-border/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">Taxa do banco</span>
              <span className="text-sm font-bold text-foreground">{bankAnnualRate.toFixed(2)}% a.a.</span>
            </div>
            {programDiscount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-wider text-green-400/80">Desconto do programa</span>
                <span className="text-sm font-bold text-green-400">−{programDiscount.toFixed(1)}% a.a.</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border/20 pt-2 mt-1">
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">Taxa efetiva</span>
              <span className="text-base font-black text-primary">{effectiveRate.toFixed(2)}% a.a.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Botão Simular ──────────────────────────────────────────────────── */}
      <div className="mt-10 flex justify-center border-t border-border/20 pt-8">
        <Button
          onClick={handleSimulate}
          disabled={isSimulating || !bankEligible}
          className="bg-gold-gradient text-primary-foreground font-bold px-6 sm:px-12 h-12 sm:h-14 md:h-16 rounded-full hover:opacity-90 transition-all shadow-xl btn-shine uppercase tracking-widest text-[10px] sm:text-[11px] w-[280px] max-w-full sm:w-auto disabled:opacity-50"
        >
          {isSimulating ? "Simulando..." : "Simular agora"}
        </Button>
      </div>

      {/* ── Resultado ─────────────────────────────────────────────────────── */}
      {simulationResult && (
        <div className="mt-10 pt-8 border-t border-border/40 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Cabeçalho do resultado */}
          <div className="mb-6 flex flex-col items-center justify-center gap-2">
            <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Resultado da Simulação</h4>
            {bank && selectedProgram && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-[10px] text-muted-foreground font-mono bg-background/50 px-3 py-1 rounded-full border border-border/30">
                  {bank.name}
                </span>
                <span className="text-[10px] text-primary font-bold font-mono bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  {selectedProgram.name}
                </span>
                <span className="text-[10px] text-foreground font-mono bg-background/50 px-3 py-1 rounded-full border border-border/30">
                  {effectiveAmortization} · {effectiveRate.toFixed(2)}% a.a.
                </span>
              </div>
            )}
            {/* Indicador de fonte dos dados */}
            {dataSource && (
              <div className="flex items-center gap-1.5 mt-1">
                {dataSource === "LIVE_BCB" ? (
                  <CheckCircle2 size={10} className="text-green-400" />
                ) : (
                  <Info size={10} className="text-amber-400" />
                )}
                <span className="text-[8px] font-mono uppercase tracking-wider text-muted-foreground/50">
                  {dataSource === "LIVE_BCB" ? "Taxa em tempo real (BCB)" : "Taxa de referência curada"}
                </span>
              </div>
            )}
            {backendError && (
              <div className="flex items-center gap-1.5 mt-1">
                <AlertCircle size={10} className="text-amber-400" />
                <span className="text-[8px] font-mono text-amber-400/70">Calculado localmente (backend indisponível)</span>
              </div>
            )}
          </div>

          {/* Métricas principais */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            <div className="bg-background/60 backdrop-blur-md border border-border/40 rounded-xl p-3 sm:p-4 text-center shadow-md flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1 leading-tight">
                {effectiveAmortization === "SAC" ? "1ª Parcela" : "Parcela Mensal"}
              </p>
              <p className="text-[11px] xs:text-xs sm:text-base md:text-lg font-bold text-gold-gradient truncate">
                {fmt(simulationResult.monthlyPayment)}
              </p>
            </div>
            <div className="bg-background/60 backdrop-blur-md border border-border/40 rounded-xl p-3 sm:p-4 text-center shadow-md flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1 leading-tight">Valor do Imóvel</p>
              <p className="text-[11px] xs:text-xs sm:text-base md:text-lg font-bold text-foreground truncate">{fmt(propertyValue)}</p>
            </div>
            <div className="bg-background/60 backdrop-blur-md border border-border/40 rounded-xl p-3 sm:p-4 text-center shadow-md flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1 leading-tight">Total Entrada</p>
              <p className="text-[11px] xs:text-xs sm:text-base md:text-lg font-bold text-foreground truncate">{fmt(Math.max(downPayment, minDown))}</p>
            </div>
            <div className="bg-background/60 backdrop-blur-md border border-border/40 rounded-xl p-3 sm:p-4 text-center shadow-md flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1 leading-tight">Valor Financiado</p>
              <p className="text-[11px] xs:text-xs sm:text-base md:text-lg font-bold text-foreground truncate">{fmt(simulationResult.financed)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 mt-4">
            <div className="bg-background/60 backdrop-blur-md border border-border/40 rounded-xl p-3 sm:p-4 text-center shadow-md flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1 leading-tight">Total Pago Estimado</p>
              <p className="text-[11px] xs:text-xs sm:text-base md:text-lg font-bold text-foreground truncate">{fmt(simulationResult.totalPaid)}</p>
            </div>
            <div className="bg-background/60 backdrop-blur-md border border-border/40 rounded-xl p-3 sm:p-4 text-center shadow-md flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1 leading-tight">Total Juros</p>
              <p className="text-[11px] xs:text-xs sm:text-base md:text-lg font-bold text-destructive truncate">{fmt(simulationResult.totalInterest)}</p>
            </div>
          </div>

          {/* Info SAC */}
          {effectiveAmortization === "SAC" && (
            <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="bg-background/40 border border-border/30 rounded-lg px-4 py-2.5 flex-1 flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Última Parcela</span>
                <span className="text-sm font-bold text-green-400">{fmt(simulationResult.lastPayment)}</span>
              </div>
              <div className="bg-background/40 border border-border/30 rounded-lg px-4 py-2.5 flex-1 flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Nº Parcelas ({effectiveYears} anos)</span>
                <span className="text-sm font-bold text-foreground">{simulationResult.totalInstallments}×</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

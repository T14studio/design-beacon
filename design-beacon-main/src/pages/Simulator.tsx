import { useEffect, useState } from "react";
import { Building2, Landmark, Info } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FinancingSimulator from "@/components/FinancingSimulator";
import MarketIndicators from "@/components/MarketIndicators";
import ScrollReveal from "@/components/ScrollReveal";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BANKS, getBankById, type BankConfig, type FinancingProgram } from "@/data/banks";
import { useLocation } from "react-router-dom";
import type { Property } from "@/data/properties";
import { getBackendBaseUrl } from "@/lib/api";
import { getWhatsAppLink } from "@/lib/whatsapp";

const BANK_LOGOS: Record<string, string> = {
  caixa: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Caixa_Econ%C3%B4mica_Federal_logo.svg",
  itau: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Banco_Ita%C3%BA_logo.svg",
  bb: "https://upload.wikimedia.org/wikipedia/commons/0/06/Banco_do_Brasil_logo.svg",
  bradesco: "https://upload.wikimedia.org/wikipedia/commons/9/97/Bradesco_logo.svg",
  santander: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Banco_Santander_Logotipo.svg",
  inter: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Banco_Inter_logo_2022.svg",
  nubank: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Nubank_logo_2021.svg",
  btg: "https://upload.wikimedia.org/wikipedia/commons/1/14/BTG_Pactual_logo.svg",
  sicredi: "https://upload.wikimedia.org/wikipedia/commons/3/35/Sicredi_logo.svg",
  sicoob: "https://upload.wikimedia.org/wikipedia/commons/8/80/Sicoob_logo_novo.svg"
};

const DEFAULT_LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOWNhM2FmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBvbHlnb24gcG9pbnRzPSIxMiAyIDIwIDcgNCA3IDEyIDIiLz48bGluZSB4MT0iNiIgeTE9IjIyIiB4Mj0iNiIgeTI9IjExIi8+PGxpbmUgeDE9IjEwIiB5MT0iMjIiIHgyPSIxMCIgeTI9IjExIi8+PGxpbmUgeDE9IjE0IiB5MT0iMjIiIHgyPSIxNCIgeTI9IjExIi8+PGxpbmUgeDE9IjE4IiB5MT0iMjIiIHgyPSIxOCIgeTI9IjExIi8+PGxpbmUgeDE9IjIiIHkxPSIyMiIgeDI9IjIyIiB5Mj0iMjIiLz48L3N2Zz4=";

export function SimulatorContent() {
  const [selectedBankId, setSelectedBankId] = useState("caixa");
  const [banks, setBanks] = useState<BankConfig[]>(BANKS);
  const [programs, setPrograms] = useState<FinancingProgram[]>([]);
  const selectedBank = banks.find((b) => b.id === selectedBankId) || getBankById(selectedBankId);
  const location = useLocation();
  const property = location.state?.property as Property | undefined;

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const base = getBackendBaseUrl();
        const res = await fetch(`${base}/finance/catalog`);
        if (!res.ok) throw new Error(`Falha ao carregar catálogo (${res.status})`);
        const data = await res.json();

        const bankRows = Array.isArray(data?.banks) ? data.banks : [];
        const mappedBanks: BankConfig[] = bankRows.map((row: any) => {
          const fallback = getBankById(row.id);
          return {
            ...fallback,
            id: row.id,
            name: row.name ?? fallback.name,
            shortName: row.short_name ?? fallback.shortName,
            logo: row.logo ?? fallback.logo,
            annualRate: Number(row.annual_rate ?? fallback.annualRate),
            rateDisplay: row.rate_display ?? fallback.rateDisplay,
            maxYears: Number(row.max_years ?? fallback.maxYears),
            minDownPaymentPercent: Number(row.min_down_payment_percent ?? fallback.minDownPaymentPercent),
            maxFinancingPercent: Number(row.max_financing_percent ?? fallback.maxFinancingPercent ?? 80),
            amortizationSystems: (row.amortization_systems ?? fallback.amortizationSystems) as any,
            financingType: row.financing_type ?? fallback.financingType,
            dataSource: "OFICIAL",
            sourceDetail: row.external_source ?? fallback.sourceDetail,
            indexers: row.indexers ?? ["TR"],
            externalSource: row.external_source,
            externalPeriodStart: row.external_period_start,
            externalPeriodEnd: row.external_period_end,
          };
        });

        if (mappedBanks.length > 0) {
          setBanks(mappedBanks);
          if (!mappedBanks.some((b) => b.id === selectedBankId)) {
            setSelectedBankId(mappedBanks[0].id);
          }
        }

        setPrograms(Array.isArray(data?.programs) ? data.programs : []);
      } catch (error) {
        console.error("[Simulator] Falha ao carregar catálogo financeiro do backend:", error);
      }
    };

    void loadCatalog();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
      {/* Sidebar — Bank Filter */}
      <ScrollReveal>
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden h-fit lg:sticky lg:top-32">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Landmark size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground tracking-tight">Instituição</h3>
              <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-mono">Selecione o banco</p>
            </div>
          </div>

          <div className="relative z-10 mb-6">
            <Select value={selectedBankId} onValueChange={setSelectedBankId}>
              <SelectTrigger className="w-full bg-background/50 h-14 rounded-2xl border-border/40 focus:ring-primary/20 text-sm px-5 font-bold hover:bg-background/80 transition-all flex items-center justify-between">
                <SelectValue placeholder="Selecione o banco" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
                {banks.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="rounded-lg focus:bg-primary/10">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 flex items-center justify-center bg-white rounded-md shrink-0 border border-border/20 shadow-sm overflow-hidden">
                          <img 
                            src={BANK_LOGOS[b.id] || b.logo || DEFAULT_LOGO} 
                            alt={b.name} 
                            className="w-full h-full object-contain p-0.5" 
                            onError={(e) => { e.currentTarget.src = DEFAULT_LOGO; }} 
                          />
                        </div>
                        <span>{b.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bank detail card */}
          <div className="relative z-10">
            <div
              key={selectedBank.id}
              className={`w-full rounded-2xl p-6 border transition-all duration-500 bg-gradient-to-r ${selectedBank.ui.gradientFrom} ${selectedBank.ui.gradientTo} ${selectedBank.ui.borderColor} shadow-lg`}
            >
              <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 flex items-center justify-center p-2 bg-white rounded-xl shadow-sm border border-white/30 shrink-0">
                    <img 
                      src={BANK_LOGOS[selectedBank.id] || selectedBank.logo || DEFAULT_LOGO} 
                      alt={selectedBank.name} 
                      className="w-full h-full object-contain" 
                      onError={(e) => { e.currentTarget.src = DEFAULT_LOGO; }} 
                    />
                  </div>
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {selectedBank.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {selectedBank.financingType}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3 bg-background/40 backdrop-blur-sm rounded-xl p-4 border border-border/30">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Taxa anual</span>
                    <span className={`font-bold ${selectedBank.ui.textColor}`}>{selectedBank.rateDisplay}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Prazo máx.</span>
                    <span className="font-bold text-foreground">{selectedBank.maxYears} anos</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Entrada mín.</span>
                    <span className="font-bold text-foreground">{selectedBank.minDownPaymentPercent}%</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Amortização</span>
                    <span className="font-bold text-foreground text-xs">{selectedBank.amortizationSystems.join(" / ")}</span>
                </div>
              </div>

              {/* Data source badge */}
              <div className="mt-3 flex items-center gap-1.5">
                <Info size={10} className="text-muted-foreground/40" />
                <span className="text-[8px] font-mono uppercase tracking-wider text-muted-foreground/40">
                  Fonte: {selectedBank.dataSource}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {selectedBank.notes && (
            <div className="mt-4 relative z-10">
              <p className="text-[9px] text-muted-foreground/60 italic leading-relaxed">
                {selectedBank.notes}
              </p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border/20 relative z-10">
            <p className="text-[9px] text-muted-foreground/50 italic leading-relaxed">
              As taxas são referenciais e podem variar conforme análise de crédito e relacionamento bancário.
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* Main — Simulator */}
      <ScrollReveal delay={150}>
        <FinancingSimulator bank={selectedBank} initialProperty={property} programs={programs} />
        
        <div className="mt-10 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6">
          <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 px-6 sm:px-12 h-12 sm:h-14 md:h-16 rounded-full font-bold tracking-widest uppercase text-[10px] sm:text-[11px] w-[280px] max-w-full sm:w-auto flex items-center justify-center group overflow-hidden">
            <a
              href={getWhatsAppLink("Olá! Quero falar com um especialista sobre financiamento imobiliário.")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full"
            >
              <svg viewBox="0 0 32 32" className="w-5 h-5 text-primary fill-current shrink-0">
                <path d="M16.004 2.003c-7.724 0-13.996 6.272-13.996 13.997 0 2.467.654 4.873 1.895 6.989L2 30l7.208-1.884A13.94 13.94 0 0 0 16.004 30c7.724 0 13.996-6.272 13.996-13.997S23.728 2.003 16.004 2.003zm0 25.594a11.58 11.58 0 0 1-5.912-1.617l-.424-.252-4.397 1.152 1.174-4.29-.277-.44a11.57 11.57 0 0 1-1.776-6.15c0-6.408 5.213-11.62 11.62-11.62 6.408 0 11.62 5.213 11.62 11.62s-5.212 11.597-11.628 11.597zm6.37-8.697c-.35-.175-2.07-1.02-2.39-1.137-.32-.117-.554-.175-.787.175s-.903 1.137-1.108 1.372-.408.263-.758.088c-.35-.175-1.477-.544-2.813-1.736-1.04-.926-1.742-2.07-1.946-2.42-.204-.35-.022-.54.153-.714.157-.157.35-.408.525-.613.175-.204.233-.35.35-.583.117-.234.058-.438-.03-.613-.087-.175-.787-1.898-1.078-2.598-.284-.683-.573-.59-.787-.601-.204-.01-.438-.012-.672-.012s-.613.088-.934.438c-.32.35-1.224 1.196-1.224 2.918 0 1.722 1.253 3.386 1.428 3.62.175.233 2.466 3.765 5.976 5.28.835.36 1.486.575 1.994.737.838.266 1.601.228 2.204.138.672-.1 2.07-.846 2.362-1.663.292-.817.292-1.518.204-1.663-.088-.146-.32-.233-.672-.408z"/>
              </svg>
              Falar com especialista
            </a>
          </Button>
        </div>
      </ScrollReveal>
    </div>
  );
}

export default function Simulator() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-12 px-6">
        <div className="container mx-auto">
          <div className="mb-6">
            <BackButton />
          </div>
          <span className="font-mono text-xs tracking-widest uppercase text-primary mb-2 block">
            Ferramentas
          </span>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            Simulador &amp; Indicadores
          </h1>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="container mx-auto">
          <ScrollReveal>
            <MarketIndicators />
          </ScrollReveal>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="container mx-auto">
          <SimulatorContent />
        </div>
      </section>

      <Footer />
    </div>
  );
}

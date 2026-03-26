import { useState } from "react";
import { Building2, Landmark } from "lucide-react";
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

const banks = [
  { id: "caixa", name: "Caixa Econômica Federal", rate: "TR + 8,99%", maxYears: 35, color: "from-blue-600/20 to-blue-400/5", borderColor: "border-blue-500/30", textColor: "text-blue-400" },
  { id: "bb", name: "Banco do Brasil", rate: "TR + 9,29%", maxYears: 35, color: "from-yellow-600/20 to-yellow-400/5", borderColor: "border-yellow-500/30", textColor: "text-yellow-400" },
  { id: "bradesco", name: "Bradesco", rate: "TR + 9,99%", maxYears: 30, color: "from-rose-600/20 to-rose-400/5", borderColor: "border-rose-500/30", textColor: "text-rose-400" },
  { id: "itau", name: "Itaú", rate: "TR + 9,89%", maxYears: 30, color: "from-orange-600/20 to-orange-400/5", borderColor: "border-orange-500/30", textColor: "text-orange-400" },
  { id: "santander", name: "Santander", rate: "TR + 9,49%", maxYears: 35, color: "from-red-600/20 to-red-400/5", borderColor: "border-red-500/30", textColor: "text-red-400" },
];

export default function Simulator() {
  const [selectedBank, setSelectedBank] = useState("caixa");

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
            Simulador & Indicadores
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

      {/* Bank selection + Simulator */}
      <section className="px-6 pb-24">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
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
                  <Select value={selectedBank} onValueChange={setSelectedBank}>
                    <SelectTrigger className="w-full bg-background/50 h-14 rounded-[2rem] border-border/40 focus:ring-primary/20 text-sm px-6 font-bold hover:bg-background/80 transition-all">
                      <SelectValue placeholder="Selecione o banco" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
                      {banks.map((b) => (
                        <SelectItem key={b.id} value={b.id} className="rounded-lg focus:bg-primary/10 font-medium">
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative z-10">
                  {banks.map((bank) => (
                     selectedBank === bank.id && (
                        <div
                          key={bank.id}
                          className={`w-full rounded-2xl p-6 border transition-all duration-500 bg-gradient-to-r ${bank.color} ${bank.borderColor} shadow-lg`}
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <Building2 size={24} className={bank.textColor} />
                            <div>
                              <p className="text-lg font-bold text-foreground">
                                {bank.name}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono mt-1">
                                Condições vigentes
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-3 bg-background/40 backdrop-blur-sm rounded-xl p-4 border border-border/30">
                            <div className="flex justify-between items-center">
                               <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Taxa anual</span>
                               <span className={`font-bold ${bank.textColor}`}>{bank.rate}</span>
                            </div>
                            <div className="flex justify-between items-center">
                               <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Prazo máx.</span>
                               <span className="font-bold text-foreground">{bank.maxYears} anos</span>
                            </div>
                          </div>
                        </div>
                     )
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-border/20 relative z-10">
                  <p className="text-[9px] text-muted-foreground/50 italic leading-relaxed">
                    As taxas são referenciais e podem variar conforme análise de crédito e relacionamento bancário.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Main — Simulator */}
            <ScrollReveal delay={150}>
              <FinancingSimulator />
              
              <div className="mt-10 flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-6">
                <Button className="bg-gold-gradient text-primary-foreground font-bold px-6 sm:px-12 h-12 sm:h-14 md:h-16 rounded-full hover:opacity-90 transition-all shadow-xl btn-shine uppercase tracking-widest text-[10px] sm:text-[11px] w-full sm:w-auto">
                  Simular agora
                </Button>
                <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 px-6 sm:px-12 h-12 sm:h-14 md:h-16 rounded-full font-bold tracking-widest uppercase text-[10px] sm:text-[11px] w-full sm:w-auto flex items-center justify-center">
                  <a href="https://wa.me/5567991193513?text=Olá! Gostaria de falar com um especialista sobre simulação de financiamento." target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full">
                    <svg viewBox="0 0 32 32" className="w-5 h-5 text-[#25D366] fill-current shrink-0">
                      <path d="M16.004 2.003c-7.724 0-13.996 6.272-13.996 13.997 0 2.467.654 4.873 1.895 6.989L2 30l7.208-1.884A13.94 13.94 0 0 0 16.004 30c7.724 0 13.996-6.272 13.996-13.997S23.728 2.003 16.004 2.003zm0 25.594a11.58 11.58 0 0 1-5.912-1.617l-.424-.252-4.397 1.152 1.174-4.29-.277-.44a11.57 11.57 0 0 1-1.776-6.15c0-6.408 5.213-11.62 11.62-11.62 6.408 0 11.62 5.213 11.62 11.62s-5.212 11.597-11.628 11.597zm6.37-8.697c-.35-.175-2.07-1.02-2.39-1.137-.32-.117-.554-.175-.787.175s-.903 1.137-1.108 1.372-.408.263-.758.088c-.35-.175-1.477-.544-2.813-1.736-1.04-.926-1.742-2.07-1.946-2.42-.204-.35-.022-.54.153-.714.157-.157.35-.408.525-.613.175-.204.233-.35.35-.583.117-.234.058-.438-.03-.613-.087-.175-.787-1.898-1.078-2.598-.284-.683-.573-.59-.787-.601-.204-.01-.438-.012-.672-.012s-.613.088-.934.438c-.32.35-1.224 1.196-1.224 2.918 0 1.722 1.253 3.386 1.428 3.62.175.233 2.466 3.765 5.976 5.28.835.36 1.486.575 1.994.737.838.266 1.601.228 2.204.138.672-.1 2.07-.846 2.362-1.663.292-.817.292-1.518.204-1.663-.088-.146-.32-.233-.672-.408z"/>
                    </svg>
                    Falar com especialista
                  </a>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

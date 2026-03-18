import { useState, useMemo } from "react";
import { Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export default function FinancingSimulator() {
  const [propertyValue, setPropertyValue] = useState(1000000);
  const [downPayment, setDownPayment] = useState(200000);
  const [years, setYears] = useState(30);
  const [rate, setRate] = useState(10.5);

  const result = useMemo(() => {
    const principal = propertyValue - downPayment;
    if (principal <= 0) return null;
    const monthlyRate = rate / 100 / 12;
    const n = years * 12;
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    const totalPaid = payment * n;
    return {
      monthlyPayment: payment,
      totalPaid,
      totalInterest: totalPaid - principal,
      financed: principal,
    };
  }, [propertyValue, downPayment, years, rate]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

  return (
    <div className="bg-card border border-border rounded-lg p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Calculator size={20} className="text-primary" />
        <h3 className="text-lg font-semibold">Simulador de Financiamento</h3>
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
            Entrada
          </label>
          <Input
            type="text"
            value={fmt(downPayment)}
            onChange={(e) => {
              const num = Number(e.target.value.replace(/\D/g, ""));
              if (!isNaN(num)) setDownPayment(num);
            }}
            className="bg-background"
          />
          <Slider
            value={[downPayment]}
            onValueChange={([v]) => setDownPayment(v)}
            min={0}
            max={propertyValue * 0.8}
            step={10000}
            className="mt-3"
          />
        </div>

        <div>
          <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-2 block">
            Prazo (anos): {years}
          </label>
          <Slider
            value={[years]}
            onValueChange={([v]) => setYears(v)}
            min={5}
            max={35}
            step={1}
            className="mt-3"
          />
        </div>

        <div>
          <label className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-2 block">
            Taxa anual (%): {rate.toFixed(1)}%
          </label>
          <Slider
            value={[rate * 10]}
            onValueChange={([v]) => setRate(v / 10)}
            min={50}
            max={180}
            step={1}
            className="mt-3"
          />
        </div>
      </div>

      {result && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-background border border-border rounded-lg p-4 text-center">
            <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1">Parcela mensal</p>
            <p className="text-lg font-bold text-gold-gradient">{fmt(result.monthlyPayment)}</p>
          </div>
          <div className="bg-background border border-border rounded-lg p-4 text-center">
            <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1">Valor financiado</p>
            <p className="text-lg font-bold text-foreground">{fmt(result.financed)}</p>
          </div>
          <div className="bg-background border border-border rounded-lg p-4 text-center">
            <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1">Total pago</p>
            <p className="text-lg font-bold text-foreground">{fmt(result.totalPaid)}</p>
          </div>
          <div className="bg-background border border-border rounded-lg p-4 text-center">
            <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1">Total juros</p>
            <p className="text-lg font-bold text-destructive">{fmt(result.totalInterest)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

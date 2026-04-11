import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

type ContractItem = {
  id: string;
  contract_number: string;
  pdf_url?: string | null;
  pdf_path?: string | null;
  created_at?: string | null;
};

function normalizeDocument(value: string) {
  return (value || "").replace(/\D/g, "").slice(0, 14);
}

function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_AXIS_WEBHOOK_URL as string | undefined;
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  if (envUrl) {
    // If it points directly to /axis/turn, derive base.
    if (envUrl.includes("/axis/turn")) {
      return envUrl.replace("/axis/turn", "");
    }
    // If it is already a base URL, accept it.
    if (envUrl.startsWith("http")) {
      return envUrl.replace(/\/+$/, "");
    }
  }

  return isLocal ? "http://localhost:8000" : "https://design-beacon.onrender.com";
}

export default function ClientArea() {
  const [document, setDocument] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contracts, setContracts] = useState<ContractItem[]>([]);

  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

  const handleSearch = async () => {
    const doc = normalizeDocument(document);
    if (![11, 14].includes(doc.length)) {
      toast.error("Informe um CPF (11 dígitos) ou CNPJ (14 dígitos).");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/client-area/contracts/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: doc }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(`Falha ao consultar contratos (${res.status}). ${errorText}`);
      }

      const data = await res.json();
      const items = Array.isArray(data.contracts) ? (data.contracts as ContractItem[]) : [];
      setContracts(items);

      if (items.length === 0) {
        toast.message("Nenhum contrato encontrado para este documento.");
      }
    } catch (e: any) {
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        console.error("[ClientArea] Erro ao consultar contratos:", e);
      }
      toast.error("Não consegui consultar seus contratos agora. Tente novamente em instantes.");
    } finally {
      setIsLoading(false);
    }
  };

  const openPdf = (item: ContractItem) => {
    if (!item.pdf_url) {
      toast.error("Este contrato não possui PDF disponível.");
      return;
    }
    window.open(item.pdf_url, "_blank", "noopener,noreferrer");
  };

  const downloadPdf = async (item: ContractItem) => {
    if (!item.pdf_url) {
      toast.error("Este contrato não possui PDF disponível.");
      return;
    }
    try {
      const res = await fetch(item.pdf_url);
      if (!res.ok) throw new Error("Falha ao baixar PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `contrato-${item.contract_number}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Não consegui baixar o PDF agora.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-3xl">
          <ScrollReveal>
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary block mb-3 font-bold">
              Área do Cliente
            </span>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.1]">
              Seus contratos e documentos
            </h1>
            <p className="text-muted-foreground/80 leading-relaxed text-lg mb-10">
              Informe seu CPF ou CNPJ para localizar seus contratos e acessar o PDF.
            </p>

            <Card className="p-6 sm:p-8 rounded-2xl bg-card/40 border border-border shadow-2xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="CPF ou CNPJ (somente números)"
                  value={document}
                  onChange={(e) => setDocument(normalizeDocument(e.target.value))}
                  className="bg-background h-12 rounded-xl"
                  inputMode="numeric"
                />
                <Button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="bg-gold-gradient text-primary-foreground font-bold tracking-widest uppercase h-12 rounded-xl px-6"
                >
                  {isLoading ? "Buscando..." : "Buscar contratos"}
                </Button>
              </div>

              <div className="mt-8 space-y-3">
                {contracts.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-border/60 bg-background/40"
                  >
                    <div>
                      <p className="text-sm font-bold">Contrato: {c.contract_number}</p>
                      {c.created_at && (
                        <p className="text-xs text-muted-foreground/70">Registrado em: {new Date(c.created_at).toLocaleString()}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => openPdf(c)} className="rounded-full">
                        Visualizar PDF
                      </Button>
                      <Button onClick={() => downloadPdf(c)} className="rounded-full bg-primary text-primary-foreground">
                        Baixar PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </ScrollReveal>
        </div>
      </div>

      <Footer />
    </div>
  );
}


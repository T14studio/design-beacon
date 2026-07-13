import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabaseClient } from "@/lib/supabase";
import { FileText, Download, Eye, Search, AlertCircle } from "lucide-react";

type ContractItem = {
  id: string;
  contract_number: string;
  nome_cliente?: string | null;
  client_name?: string | null; // Novo campo
  tipo_contrato?: string | null;
  contract_type?: string | null; // Novo campo
  imovel?: string | null;
  pdf_url?: string | null;
  pdf_path?: string | null;
  created_at?: string | null;
  status?: string | null;
};

function normalizeDocument(value: string) {
  return (value || "").replace(/\D/g, "").slice(0, 14);
}

// Função para garantir que a URL do PDF aponte para a instância correta
function getCorrectPdfUrl(item: ContractItem) {
  if (!item.pdf_url) return null;
  
  const currentUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  if (!currentUrl) return item.pdf_url;

  // Se a URL do PDF aponta para outra instância (ex: hocrbyevkaothhnxptem),
  // e temos o pdf_path, reconstruímos a URL para a instância atual.
  if (!item.pdf_url.includes(currentUrl.replace('https://', '')) && item.pdf_path) {
    return `${currentUrl}/storage/v1/object/public/contracts/${item.pdf_path}`;
  }
  
  return item.pdf_url;
}

export default function ClientArea() {
  const [document, setDocument] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    const doc = normalizeDocument(document);
    if (![11, 14].includes(doc.length)) {
      toast.error("Informe um CPF (11 dígitos) ou CNPJ (14 dígitos).");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    
    try {
      // Busca direta no Supabase com suporte a múltiplos campos de documento
      const { data, error } = await supabaseClient
        .from('contracts')
        .select('*')
        .or(`cpf.eq.${doc},cnpj.eq.${doc},cpf_cnpj.eq.${doc},documento.eq.${doc},client_cpf.eq.${doc}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("[ClientArea] Erro Supabase:", error);
        throw new Error(error.message);
      }

      const items = (data || []) as ContractItem[];
      setContracts(items);

      if (items.length === 0) {
        toast.info("Nenhum contrato encontrado para este documento.");
      } else {
        toast.success(`${items.length} contrato(s) localizado(s)!`);
      }
    } catch (e: any) {
      console.error("[ClientArea] Erro ao consultar contratos:", e);
      toast.error("Não consegui consultar seus contratos agora. Verifique sua conexão.");
    } finally {
      setIsLoading(false);
    }
  };

  const openPdf = (item: ContractItem) => {
    const url = getCorrectPdfUrl(item);
    if (!url) {
      toast.error("Este contrato não possui PDF disponível para visualização.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const downloadPdf = async (item: ContractItem) => {
    const url = getCorrectPdfUrl(item);
    if (!url) {
      toast.error("Este contrato não possui PDF disponível para download.");
      return;
    }
    
    const toastId = toast.loading("Preparando download...");
    
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Falha ao baixar PDF");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = blobUrl;
      a.download = `contrato-${item.contract_number}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
      toast.success("Download concluído!", { id: toastId });
    } catch (e) {
      toast.error("Não consegui baixar o PDF agora. Tente visualizar primeiro.", { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <Navbar />

      <main className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <ScrollReveal>
            <div className="text-center mb-12">
              <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-primary block mb-4 font-bold bg-primary/10 w-fit mx-auto px-3 py-1 rounded-full">
                Portal de Documentos
              </span>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.1] text-balance">
                Área do Cliente
              </h1>
              <p className="text-muted-foreground/80 leading-relaxed text-lg max-w-2xl mx-auto">
                Acesse seus contratos, vistorias e documentos de forma rápida e segura. 
                Basta informar o documento do titular.
              </p>
            </div>

            <Card className="p-1 rounded-3xl bg-card/30 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl overflow-hidden mb-12">
              <div className="p-6 sm:p-10">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="CPF ou CNPJ (somente números)"
                      value={document}
                      onChange={(e) => setDocument(normalizeDocument(e.target.value))}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="bg-background/50 h-14 pl-12 rounded-2xl border-white/5 focus:border-primary/50 focus:ring-primary/20 text-lg transition-all"
                      inputMode="numeric"
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="bg-gold-gradient text-primary-foreground font-bold tracking-widest uppercase h-14 rounded-2xl px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Buscando
                      </span>
                    ) : (
                      "Acessar documentos"
                    )}
                  </Button>
                </div>
                
                <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground/60 justify-center sm:justify-start">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Seus dados são protegidos e criptografados.</span>
                </div>
              </div>
            </Card>

            {hasSearched && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-semibold">
                    {contracts.length > 0 ? "Documentos encontrados" : ""}
                  </h2>
                  {contracts.length > 0 && (
                    <span className="text-sm text-muted-foreground bg-white/5 px-3 py-1 rounded-full border border-white/5">
                      {contracts.length} item(s)
                    </span>
                  )}
                </div>

                {contracts.length > 0 ? (
                  <div className="grid gap-4">
                    {contracts.map((c, index) => (
                      <Card 
                        key={c.id} 
                        className="group p-0 rounded-2xl border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 overflow-hidden"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                          
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg truncate">
                                {c.contract_number}
                              </h3>
                              {c.status && (
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                                  c.status === 'ativo' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                  'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                }`}>
                                  {c.status}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              <span className="text-sm text-muted-foreground font-medium">
                                {c.nome_cliente || c.client_name || "Titular não informado"}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                              {(c.tipo_contrato || c.contract_type) && (
                                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-primary/50" />
                                  {c.tipo_contrato || c.contract_type}
                                </span>
                              )}
                              {c.created_at && (
                                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-primary/50" />
                                  {new Date(c.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                            {c.imovel && (
                              <p className="text-xs text-muted-foreground/60 mt-2 truncate max-w-md">
                                {c.imovel}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 shrink-0">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openPdf(c)} 
                              className="rounded-xl w-12 h-12 bg-white/5 hover:bg-white/10 hover:text-primary transition-all"
                              title="Visualizar"
                            >
                              <Eye className="w-5 h-5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => downloadPdf(c)} 
                              className="rounded-xl w-12 h-12 bg-white/5 hover:bg-white/10 hover:text-primary transition-all"
                              title="Baixar PDF"
                            >
                              <Download className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  !isLoading && (
                    <Card className="p-12 rounded-3xl border-dashed border-white/10 bg-transparent text-center">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                        <Search className="w-8 h-8 text-muted-foreground/20" />
                      </div>
                      <h3 className="text-xl font-medium mb-2 text-muted-foreground">Nenhum contrato encontrado</h3>
                      <p className="text-muted-foreground/60 max-w-xs mx-auto">
                        Verifique se o número do documento está correto ou entre em contato com nosso suporte.
                      </p>
                    </Card>
                  )
                )}
              </div>
            )}
          </ScrollReveal>
        </div>
      </main>

      <Footer />
    </div>
  );
}



import React, { useMemo, useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, User, Bot, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "gallery";
  images?: string[];
}

interface AxisChatProps {
  initialMessage?: string;
  propertyContext?: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function AxisChat({ initialMessage, propertyContext, isOpen, onClose }: AxisChatProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem("axis_chat_messages");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("Could not load chat messages from localStorage:", e);
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem("axis_session_id");
    } catch (e) {
      console.warn("Could not load axis_session_id from localStorage:", e);
      return null;
    }
  });

  // Persist messages to localStorage
  useEffect(() => {
    localStorage.setItem("axis_chat_messages", JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll to bottom anchor
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // URL do Webhook da Axis
  const getWebhookUrl = () => {
    let envUrl = import.meta.env.VITE_AXIS_WEBHOOK_URL as string | undefined;
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    
    if (envUrl && (!envUrl.includes("localhost") || isLocal)) {
      // Remove trailing slash if present
      envUrl = envUrl.replace(/\/+$/, "");
      
      // If the user only provided the base URL (without /axis/turn), append it
      if (!envUrl.endsWith("/axis/turn")) {
        // Just in case they provided an endpoint for something else, let's strictly replace or append
        if (envUrl.endsWith("/api")) envUrl = envUrl.replace(/\/api$/, "");
        envUrl = `${envUrl}/axis/turn`;
      }
      return envUrl;
    }
    
    // Fallback absoluto focado no onrender para procução
    return isLocal 
      ? "http://localhost:8000/axis/turn" 
      : "https://design-beacon.onrender.com/axis/turn";
  };

  const AXIS_WEBHOOK_URL = getWebhookUrl();

  // SECURITY: Limite de caracteres alinhado com o backend (max_length=2000)
  const MAX_MESSAGE_LENGTH = 2000;

  // Apenas loga o endpoint em ambiente de desenvolvimento
  const isDev = typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  const propertyImages = useMemo<string[]>(() => {
    const imgs = propertyContext?.images;
    return Array.isArray(imgs) ? imgs.filter(Boolean) : [];
  }, [propertyContext]);

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const isPhotoIntent = (text: string) => {
    const t = (text || "").toLowerCase();
    return (
      t.includes("mais foto") ||
      t.includes("mais fotos") ||
      t.includes("ver fotos") ||
      t.includes("me mostra as fotos") ||
      t.includes("me mostra") ||
      t.includes("mostrar as fotos") ||
      t.includes("tem mais imagens") ||
      t.includes("mais imagens") ||
      t.includes("ver imagens") ||
      t.includes("quero ver esse imóvel melhor") ||
      t.includes("quero ver este imóvel melhor") ||
      t.includes("ver fotos extras") ||
      t.includes("foto extras") ||
      t.includes("imagens do imóvel") ||
      t.includes("fotos do imóvel")
    );
  };

  // initial greeting + reset scroll
  useEffect(() => {
    if (isOpen) {
      if (messages.length === 0 && !initialMessage) {
        const savedName = localStorage.getItem("axis_user_name");
        const greeting = savedName
          ? `Olá, ${savedName}! Eu sou a Axis, assistente virtual da Ética. Com o que posso te ajudar agora?`
          : "Olá! Eu sou a Axis, assistente virtual da Ética. Posso te ajudar com compra, locação, contratos, documentos, manutenção, boletos e pagamentos. Me conta o que você precisa e eu te direciono da forma mais rápida possível.";
        setMessages([{ role: "assistant", content: greeting }]);
      }
      // SECURITY: endpoint apenas em dev
      if (isDev) console.log("[AxisChat] Endpoint:", AXIS_WEBHOOK_URL);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [isOpen]);

  // Keep track of last initialMessage we sent to avoid duplicates
  const prevInitialMessage = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!isOpen) return;
    if (!initialMessage) return;
    // Only send the initialMessage if it's new and hasn't been sent yet
    if (initialMessage === prevInitialMessage.current) return;
    // Don't auto-send if we already have conversation history (avoids duplicate on re-open)
    if (messages.length > 1) {
      prevInitialMessage.current = initialMessage;
      return;
    }
    prevInitialMessage.current = initialMessage;
    handleSendMessage(initialMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialMessage]);

  const showPropertyGallery = (originText?: string) => {
    if (!propertyContext || propertyImages.length === 0) return false;
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        type: "gallery",
        content: originText?.trim()
          ? `Perfeito — aqui estão mais fotos do imóvel${propertyContext?.title ? ` "${propertyContext.title}"` : ""}.`
          : `Aqui estão as fotos do imóvel${propertyContext?.title ? ` "${propertyContext.title}"` : ""}.`,
        images: propertyImages,
      },
    ]);
    setIsGalleryOpen(true);
    return true;
  };

  const handleSendMessage = async (text: string) => {
    // SECURITY: Limpa e valida a mensagem antes de qualquer processamento
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Mensagem muito longa. Limite: ${MAX_MESSAGE_LENGTH} caracteres.`);
      return;
    }

    // Photo intent is now handled by the backend to keep history.
    // We just send the message normally.

    const userMessage: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // SECURITY: browser_user_id gerado com apenas caracteres seguros
      const storedId = localStorage.getItem("axis_user_id");
      const browser_user_id = storedId && /^[a-zA-Z0-9\-_]{4,128}$/.test(storedId)
        ? storedId
        : "web-" + crypto.randomUUID().replace(/-/g, "").substring(0, 16);
      if (!localStorage.getItem("axis_user_id") || browser_user_id !== storedId) {
        localStorage.setItem("axis_user_id", browser_user_id);
      }

      // SECURITY: page_url cortada para não vazar query strings com dados sensíveis
      const safePageUrl = window.location.origin + window.location.pathname;

      const payload = {
        channel: "website",
        browser_user_id: browser_user_id,
        phone: localStorage.getItem("axis_user_phone") || null,
        name: localStorage.getItem("axis_user_name") || null,
        message: trimmed,
        session_id: sessionId,
        optional_context: propertyContext ? {
          page_url: safePageUrl,
          property_id: propertyContext.id,
          property_title: propertyContext.title,
          property_mode: propertyContext.mode,
          property_type: propertyContext.type,
          address: propertyContext.address,
          price: propertyContext.price
        } : null,
        property_code: propertyContext ? propertyContext.id : null
      };

      // SECURITY: apenas loga em dev
      if (isDev) console.log("[AxisChat] Sending payload to:", AXIS_WEBHOOK_URL);

      const response = await fetch(AXIS_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Erro desconhecido");
        throw new Error(`Falha na comunicação com a Axis (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      if (data.session_id) {
        setSessionId(data.session_id);
        localStorage.setItem("axis_session_id", data.session_id);
      }
      // Persist name as soon as the API returns it
      if (data.nome_cliente && typeof data.nome_cliente === "string") {
        localStorage.setItem("axis_user_name", data.nome_cliente);
      }

      let botMsgContent = "Desculpe, tive um problema ao processar sua resposta.";
      if (data.reply) {
        botMsgContent = data.reply;
      } else if (data.message_to_user) {
        botMsgContent = data.message_to_user;
      }

      const botMessage: Message = { 
        role: "assistant", 
        content: botMsgContent 
      };
      // Trigger gallery if backend requested
      if (data.exibir_fotos_galeria && propertyImages.length > 0) {
        botMessage.type = "gallery";
        botMessage.images = propertyImages;
        setIsGalleryOpen(true);
      }
      
      // Store suggestions for UI
      if (data.sugestoes_de_cta) {
        (botMessage as any).ctaSuggestions = data.sugestoes_de_cta;
      }
      
      setMessages((prev) => [...prev, botMessage]);

      if (data.handoff_triggered || data.handoff_recomendado) {
        toast.success("Atendimento encaminhado para nossa equipe!");
      }

    } catch (error: any) {
      // SECURITY: nunca expor detalhes de erro em produção
      if (isDev) console.error("Axis Error Details:", error);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Ops! Tive um problema de conexão. Poderia tentar novamente?"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed bottom-24 right-4 sm:right-6 z-[60] w-[90vw] sm:w-[400px] h-[500px] max-h-[70vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
      {/* Header */}
      <div className="p-4 bg-gold-gradient flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3 text-primary-foreground">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot size={18} />
          </div>
          <div>
            <p className="text-sm font-bold tracking-widest uppercase">Axis Assistant</p>
            <p className="text-[10px] opacity-80">Atendimento Virtual</p>
          </div>
        </div>
        <button onClick={onClose} className="text-primary-foreground/80 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-background/50">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", 
                msg.role === "user" ? "bg-primary/20" : "bg-gold-gradient text-primary-foreground")}>
                {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={cn("max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm", 
                msg.role === "user" ? "bg-card border border-border" : "bg-card border border-primary/20 text-foreground")}>
                {msg.content}
                {msg.type === "gallery" && Array.isArray(msg.images) && msg.images.length > 0 && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsGalleryOpen(true)}
                      className="text-[10px] h-7 border-primary/30 hover:bg-primary/10 rounded-full"
                    >
                      Abrir galeria ({msg.images.length})
                    </Button>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {msg.images.slice(0, 6).map((src, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setIsGalleryOpen(true)}
                          className="rounded-lg overflow-hidden border border-border/60 hover:border-primary/30 transition-colors"
                          aria-label="Ver foto do imóvel"
                        >
                          <img src={src} alt="" className="w-full h-16 object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* CTAs Sugeridos */}
          {!isLoading && messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
            <div className="flex flex-wrap gap-2 pl-11 mb-2">
              {(messages[messages.length - 1] as any).ctaSuggestions?.map((cta: string, idx: number) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const normalized = (cta || "").toLowerCase().trim();
                    if ((normalized.includes("foto") || normalized.includes("imagem")) && propertyImages.length > 0) {
                      showPropertyGallery(cta);
                      return;
                    }
                    handleSendMessage(cta);
                  }}
                  className="text-[10px] h-7 border-primary/30 hover:bg-primary/10 rounded-full animate-in fade-in slide-in-from-bottom-1 duration-300"
                >
                  {cta}
                </Button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex gap-3 flex-row">
              <div className="w-8 h-8 rounded-full bg-gold-gradient text-primary-foreground flex items-center justify-center flex-shrink-0 animate-pulse">
                <Bot size={14} />
              </div>
              <div className="bg-card border border-primary/10 p-3 rounded-2xl flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-primary" />
                <span className="text-xs text-muted-foreground italic">Axis está digitando...</span>
              </div>
            </div>
          )}
          {/* Bottom anchor for auto-scroll */}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
        className="p-4 bg-card border-t border-border flex gap-2"
      >
        <Input 
          placeholder="Digite sua mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          className="bg-background h-10 rounded-xl"
          disabled={isLoading}
          maxLength={MAX_MESSAGE_LENGTH}
        />
        <Button 
          type="submit" 
          size="icon" 
          className="bg-gold-gradient text-primary-foreground rounded-xl w-10 h-10 shrink-0 shadow-gold-gradient/20"
          disabled={isLoading || !input.trim()}
        >
          <Send size={18} />
        </Button>
      </form>
    </div>

    <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {propertyContext?.title ? `Galeria — ${propertyContext.title}` : "Galeria do imóvel"}
          </DialogTitle>
        </DialogHeader>
        {propertyImages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Não encontrei imagens para este imóvel.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {propertyImages.map((src, idx) => (
              <a
                key={idx}
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-colors"
              >
                <img src={src} alt="" className="w-full h-40 object-cover" />
              </a>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}

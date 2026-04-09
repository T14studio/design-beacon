import React, { useState, useEffect } from "react";
import { MessageCircle, MessageSquareText } from "lucide-react";
import AxisChat from "./AxisChat";
import { useLocation } from "react-router-dom";
import { properties } from "@/data/properties";
import { WHATSAPP_NUMBER, WHATSAPP_DEFAULT_MESSAGE } from "@/config/constants";

export default function WhatsAppButton() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatData, setChatData] = useState<{ initialMessage?: string, propertyContext?: any }>({});
  const location = useLocation();

  useEffect(() => {
    const handleOpenChat = (e: any) => {
      const { initialMessage, propertyContext } = e.detail || {};
      setChatData({ initialMessage, propertyContext });
      setIsChatOpen(true);
    };

    window.addEventListener("open-axis-chat", handleOpenChat);
    return () => window.removeEventListener("open-axis-chat", handleOpenChat);
  }, []);

  const handleOpenWhatsApp = () => {
    let message = WHATSAPP_DEFAULT_MESSAGE;
    const pathParts = location.pathname.split("/");
    
    if (pathParts[1] === "imoveis" && pathParts[2]) {
      const propertyId = pathParts[2];
      const property = properties.find(p => p.id === propertyId);
      if (property) {
        message = `Olá! Vim pelo site da Ética Áxis e tenho interesse neste imóvel: ${property.title}. Link: ${window.location.href}`;
      }
    }
    
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <>
      <button
        onClick={handleOpenWhatsApp}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#25D366] text-white shadow-xl shadow-green-500/30 hover:scale-110 active:scale-95 transition-all duration-300 animate-fade-in group"
        aria-label="Falar no WhatsApp"
      >
        <div className="absolute -top-12 right-0 bg-card border border-border px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Falar no WhatsApp
        </div>
        <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-white/20"></span>
        </span>
      </button>

      {/* Botão Axis */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-50 flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-card border border-border text-foreground shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 animate-fade-in group"
        aria-label="Atendimento Axis"
      >
        <div className="absolute -top-12 right-0 bg-card border border-border px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Falar com Axis (IA)
        </div>
        <MessageSquareText className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
      </button>

      {/* Axis Chat Renderizado */}
      <AxisChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialMessage={chatData.initialMessage}
        propertyContext={chatData.propertyContext}
      />
    </>
  );
}

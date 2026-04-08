import React, { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import AxisChat from "./AxisChat";
import { useLocation } from "react-router-dom";
import { properties } from "@/data/properties";

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

  const handleToggleChat = () => {
    if (!isChatOpen) {
      // Se estiver em uma página de imóvel, tenta capturar o contexto automaticamente
      const pathParts = location.pathname.split("/");
      if (pathParts[1] === "imoveis" && pathParts[2]) {
        const propertyId = pathParts[2];
        const property = properties.find(p => p.id === propertyId);
        if (property) {
          setChatData({
            propertyContext: {
              id: property.id,
              title: property.title,
              mode: property.mode,
              type: property.type,
              address: property.address,
              price: property.price,
              images: property.images
            }
          });
        }
      } else {
        // Limpa contexto se não estiver em página de imóvel e for abrir do zero
        setChatData({});
      }
    }
    setIsChatOpen(!isChatOpen);
  };

  return (
    <>
      <button
        onClick={handleToggleChat}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#25D366] text-white shadow-xl shadow-green-500/30 hover:scale-110 active:scale-95 transition-all duration-300 animate-fade-in group"
        aria-label="Atendimento Axis"
      >

        <div className="absolute -top-12 right-0 bg-card border border-border px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {isChatOpen ? "Fechar Chat" : "Mande um Oi para a Axis"}
        </div>
        <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-white/20"></span>
        </span>
      </button>

      <AxisChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialMessage={chatData.initialMessage}
        propertyContext={chatData.propertyContext}
      />
    </>
  );
}

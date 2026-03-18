import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5511999999999";

export default function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-green-600 text-white shadow-lg shadow-green-600/30 hover:bg-green-500 hover:scale-110 transition-all duration-300"
      aria-label="WhatsApp"
    >
      <MessageCircle size={26} fill="currentColor" />
    </a>
  );
}

const DEFAULT_WHATSAPP_NUMBER = "5567991193513";

export function getWhatsAppNumber(): string {
  const raw = (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) || DEFAULT_WHATSAPP_NUMBER;
  return raw.replace(/\D/g, "");
}

export function getWhatsAppLink(message?: string): string {
  const number = getWhatsAppNumber();
  const text = encodeURIComponent(message || "Olá! Gostaria de falar com um especialista.");
  return `https://wa.me/${number}?text=${text}`;
}


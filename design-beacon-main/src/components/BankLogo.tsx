import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Mapeamento fixo de logos por bank_id.
// URLs apontam para domínios estáticos públicos (Wikipedia/Wikimedia CDN).
// Se a imagem falhar no carregamento, o componente usa o fallback de iniciais.
// Para nunca depender de API externa, cada banco também tem fallback visual.
// ─────────────────────────────────────────────────────────────────────────────
export const BANK_LOGOS: Record<string, string> = {
  caixa:     "https://upload.wikimedia.org/wikipedia/commons/8/8e/Caixa_Econ%C3%B4mica_Federal_logo.svg",
  itau:      "https://upload.wikimedia.org/wikipedia/commons/8/8e/Banco_Ita%C3%BA_logo.svg",
  bb:        "https://upload.wikimedia.org/wikipedia/commons/0/06/Banco_do_Brasil_logo.svg",
  bradesco:  "https://upload.wikimedia.org/wikipedia/commons/9/97/Bradesco_logo.svg",
  santander: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Banco_Santander_Logotipo.svg",
  inter:     "https://upload.wikimedia.org/wikipedia/commons/6/6d/Banco_Inter_logo_2022.svg",
  nubank:    "https://upload.wikimedia.org/wikipedia/commons/f/f7/Nubank_logo_2021.svg",
  btg:       "https://upload.wikimedia.org/wikipedia/commons/1/14/BTG_Pactual_logo.svg",
  sicredi:   "https://upload.wikimedia.org/wikipedia/commons/3/35/Sicredi_logo.svg",
  sicoob:    "https://upload.wikimedia.org/wikipedia/commons/8/80/Sicoob_logo_novo.svg",
};

// Cores de fallback por banco (quando imagem não carrega)
const BANK_FALLBACK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  caixa:     { bg: "from-blue-600/30 to-blue-400/10",     text: "text-blue-300",   border: "border-blue-500/40" },
  itau:      { bg: "from-orange-600/30 to-orange-400/10", text: "text-orange-300", border: "border-orange-500/40" },
  bb:        { bg: "from-yellow-600/30 to-yellow-400/10", text: "text-yellow-300", border: "border-yellow-500/40" },
  bradesco:  { bg: "from-rose-600/30 to-rose-400/10",     text: "text-rose-300",   border: "border-rose-500/40" },
  santander: { bg: "from-red-600/30 to-red-400/10",       text: "text-red-300",    border: "border-red-500/40" },
  inter:     { bg: "from-orange-500/30 to-amber-400/10",  text: "text-orange-200", border: "border-orange-400/40" },
  nubank:    { bg: "from-purple-600/30 to-violet-400/10", text: "text-purple-300", border: "border-purple-500/40" },
  btg:       { bg: "from-sky-600/30 to-cyan-400/10",      text: "text-sky-300",    border: "border-sky-500/40" },
  sicredi:   { bg: "from-green-600/30 to-emerald-400/10", text: "text-green-300",  border: "border-green-500/40" },
  sicoob:    { bg: "from-teal-600/30 to-teal-400/10",     text: "text-teal-300",   border: "border-teal-500/40" },
};

const DEFAULT_FALLBACK = { bg: "from-slate-600/30 to-slate-400/10", text: "text-slate-300", border: "border-slate-500/40" };

type LogoSize = "xs" | "sm" | "md" | "lg";

const SIZE_CONFIG: Record<LogoSize, { container: string; font: string; padding: string }> = {
  xs: { container: "w-5  h-5",  font: "text-[8px]",  padding: "p-0.5" },
  sm: { container: "w-6  h-6",  font: "text-[10px]", padding: "p-0.5" },
  md: { container: "w-10 h-10", font: "text-xs",     padding: "p-1"   },
  lg: { container: "w-12 h-12", font: "text-sm",     padding: "p-1.5" },
};

interface BankLogoProps {
  /** ID do banco (ex: "caixa", "itau"). Usado para lookup no BANK_LOGOS. */
  bankId: string;
  /** Nome completo para alt text */
  name: string;
  /** Iniciais exibidas no fallback (máx 2 chars) */
  shortName: string;
  /** URL do logo (se já disponível no objeto de banco). Prioritário sobre BANK_LOGOS. */
  logoUrl?: string;
  /** Tamanho do elemento */
  size?: LogoSize;
  /** Classes extras para o container */
  className?: string;
}

/**
 * BankLogo
 *
 * Componente controlado por estado React — sem manipulação de DOM.
 * Tenta carregar a imagem; em falha (onError), exibe fallback de iniciais com
 * as cores correspondentes ao banco, sem piscar ou deixar espaço em branco.
 *
 * Hierarquia de resolução do logo:
 *   1. props.logoUrl (passado pelo objeto BankConfig)
 *   2. BANK_LOGOS[bankId]  (mapeamento fixo interno)
 *   3. Fallback visual (iniciais coloridas) — nunca falha
 */
export function BankLogo({
  bankId,
  name,
  shortName,
  logoUrl,
  size = "md",
  className = "",
}: BankLogoProps) {
  const resolvedUrl = logoUrl ?? BANK_LOGOS[bankId] ?? null;
  const [failed, setFailed] = useState(false);

  const { container, font, padding } = SIZE_CONFIG[size];
  const fallback = BANK_FALLBACK_COLORS[bankId] ?? DEFAULT_FALLBACK;
  const initials = shortName.slice(0, 2).toUpperCase();

  // ── Fallback visual ────────────────────────────────────────────────────────
  if (!resolvedUrl || failed) {
    return (
      <div
        className={`
          ${container} ${className}
          rounded-lg flex items-center justify-center shrink-0
          font-black tracking-widest select-none
          bg-gradient-to-br ${fallback.bg}
          ${fallback.text} border ${fallback.border}
          backdrop-blur-sm
        `}
        title={name}
        aria-label={name}
      >
        <span className={font}>{initials}</span>
      </div>
    );
  }

  // ── Imagem com fallback reativo ────────────────────────────────────────────
  return (
    <div
      className={`
        ${container} ${padding} ${className}
        shrink-0 flex items-center justify-center
        bg-white/10 rounded-lg border border-white/15
        backdrop-blur-sm overflow-hidden
      `}
    >
      <img
        src={resolvedUrl}
        alt={name}
        className="w-full h-full object-contain"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

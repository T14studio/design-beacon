interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "text-[clamp(22px,2.2vw,32px)]",
  md: "text-[clamp(28px,2.5vw,42px)]",
  lg: "text-[clamp(34px,3vw,52px)]",
};

const subSizes = {
  sm: "text-[clamp(8px,0.7vw,11px)]",
  md: "text-[clamp(10px,0.9vw,14px)]",
  lg: "text-[clamp(12px,1.1vw,16px)]",
};

export default function Logo({ className = "", size = "md" }: LogoProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center leading-none ${className}`}
      aria-label="Ética Áxis Imobiliária"
      role="img"
    >
      <div
        className={`flex items-center gap-[0.25em] font-['Playfair_Display',Georgia,serif] font-semibold ${sizes[size]} tracking-[0.08em] text-[#c9a24a] uppercase`}
      >
        <span>ÉTICA</span>
        <span className="relative w-[1em] h-[1em] flex items-center justify-center">
          <span className="absolute inset-0 rounded-full border-2 border-[#c9a24a]" />
          <span className="absolute w-[2px] h-full bg-[#c9a24a]" />
        </span>
        <span>ÁXIS</span>
      </div>
      <div
        className={`mt-[0.4em] font-['Playfair_Display',Georgia,serif] ${subSizes[size]} tracking-[0.5em] text-[#c9a24a] uppercase`}
      >
        IMOBILIÁRIA
      </div>
    </div>
  );
}

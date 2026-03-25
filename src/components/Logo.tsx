import { cn } from "@/lib/utils";

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
  // Using em-based sizing so CRECI always scales exactly to 12% of the main logo size
  return (
    <div
      className={cn("flex flex-col items-center justify-center leading-none", className)}
      aria-label="Ética Áxis Imobiliária"
      role="img"
    >
      <div
        className={cn(
          "flex items-center gap-[0.25em] font-['Playfair_Display',Georgia,serif] font-semibold tracking-[0.08em] text-[#c9a24a] uppercase",
          sizes[size]
        )}
      >
        <span>ÉTICA</span>
        <span className="relative w-[1em] h-[1em] flex items-center justify-center">
          <span className="absolute inset-0 rounded-full border-[0.05em] border-[#c9a24a]" />
          <span className="absolute w-[0.05em] h-[1em] bg-[#c9a24a]" />
        </span>
        <span>ÁXIS</span>
      </div>
      <div
        className={cn(
          "flex flex-col items-center mt-[0.4em] text-[#c9a24a] uppercase",
          sizes[size] /* Using parent size to calculate ems correctly for children */
        )}
      >
        <span className={cn("font-['Playfair_Display',Georgia,serif] tracking-[0.5em] text-[0.35em]")}>
          IMOBILIÁRIA
        </span>
        <span className="font-mono tracking-[0.3em] font-bold text-[#c9a24a]/80 text-[0.16em] mt-[0.8em]">
          CRECI 12345-J
        </span>
      </div>
    </div>
  );
}

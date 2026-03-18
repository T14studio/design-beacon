interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { width: 140, height: 28, fontSize: 22, subSize: 9, gap: 16 },
  md: { width: 200, height: 40, fontSize: 30, subSize: 12, gap: 22 },
  lg: { width: 300, height: 60, fontSize: 44, subSize: 16, gap: 32 },
};

export default function Logo({ className = "", showSubtitle = false, size = "md" }: LogoProps) {
  const s = sizes[size];

  return (
    <svg
      viewBox={`0 0 ${s.width} ${showSubtitle ? s.height + s.gap : s.height}`}
      width={s.width}
      height={showSubtitle ? s.height + s.gap : s.height}
      className={className}
      aria-label="Ética Áxis Imobiliária"
      role="img"
    >
      <defs>
        <linearGradient id="logo-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(37, 50%, 72%)" />
          <stop offset="50%" stopColor="hsl(37, 42%, 60%)" />
          <stop offset="100%" stopColor="hsl(37, 35%, 45%)" />
        </linearGradient>
      </defs>
      <text
        x="50%"
        y={s.height * 0.78}
        textAnchor="middle"
        fill="url(#logo-gold)"
        fontFamily="'Georgia', 'Times New Roman', serif"
        fontSize={s.fontSize}
        fontWeight="400"
        letterSpacing="0.12em"
      >
        ÉTICA ÁXIS
      </text>
      {showSubtitle && (
        <text
          x="50%"
          y={s.height + s.subSize + 6}
          textAnchor="middle"
          fill="url(#logo-gold)"
          fontFamily="'Georgia', 'Times New Roman', serif"
          fontSize={s.subSize}
          fontWeight="400"
          letterSpacing="0.35em"
        >
          IMOBILIÁRIA
        </text>
      )}
    </svg>
  );
}

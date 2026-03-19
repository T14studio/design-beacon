interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { width: 180, height: 56 },
  md: { width: 220, height: 68 },
  lg: { width: 300, height: 92 },
};

export default function Logo({ className = "", size = "md" }: LogoProps) {
  const { width, height } = sizes[size];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 68"
      width={width}
      height={height}
      className={`${className}`}
      aria-label="Ética Áxis Imobiliária"
      role="img"
    >
      {/* ÉTICA ÁXIS */}
      <text
        x="110"
        y="26"
        textAnchor="middle"
        fontFamily="'Georgia', 'Times New Roman', serif"
        fontSize="24"
        fontWeight="700"
        letterSpacing="6"
        fill="currentColor"
      >
        ÉTICA ÁXIS
      </text>

      {/* Decorative line */}
      <line x1="40" y1="35" x2="180" y2="35" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />

      {/* Diamond symbol */}
      <polygon
        points="110,31 114,35 110,39 106,35"
        fill="currentColor"
        opacity="0.7"
      />

      {/* IMOBILIÁRIA */}
      <text
        x="110"
        y="50"
        textAnchor="middle"
        fontFamily="'Georgia', 'Times New Roman', serif"
        fontSize="10"
        fontWeight="400"
        letterSpacing="5"
        fill="currentColor"
        opacity="0.75"
      >
        IMOBILIÁRIA
      </text>
    </svg>
  );
}

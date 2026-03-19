interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-16",
  md: "h-20",
  lg: "h-28",
};

export default function Logo({ className = "", size = "md" }: LogoProps) {
  return (
    <img
      src="/logo-etica-axis.svg"
      alt="Ética Áxis Imobiliária"
      className={`${sizeClasses[size]} w-auto object-contain ${className}`}
    />
  );
}

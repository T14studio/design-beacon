interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-12",
  md: "h-16",
  lg: "h-24",
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

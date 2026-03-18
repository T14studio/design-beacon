interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-10",
  md: "h-14",
  lg: "h-20",
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

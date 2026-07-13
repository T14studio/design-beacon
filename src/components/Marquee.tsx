export default function Marquee() {
  const text = "Exclusividade • Confiança • Experiência • Alto Padrão • Sofisticação • ";
  return (
    <div className="overflow-hidden border-y border-border py-5 bg-card">
      <div className="animate-marquee whitespace-nowrap flex">
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className="text-lg md:text-xl font-light tracking-[0.2em] uppercase text-muted-foreground/50 mx-0"
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Desejo Alugar", path: "/imoveis?mode=locacao" },
  { label: "Desejo Comprar", path: "/imoveis?mode=venda" },
  { label: "Lançamentos", path: "/imoveis?type=lancamento" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <nav className="container mx-auto flex items-center justify-between h-16 sm:h-20 md:h-24 px-4 sm:px-6 relative">
        
        {/* Desktop Left Nav */}
        <ul className="hidden md:flex items-center gap-6 lg:gap-8 flex-1">
          {navLinks.map((l) => (
            <li key={l.path} className="relative group">
              <Link
                to={l.path}
                className={cn(
                  "text-[10px] lg:text-[11px] font-semibold tracking-[0.2em] uppercase transition-colors duration-300",
                  pathname === l.path ? "text-primary" : "text-foreground/60 group-hover:text-primary"
                )}
              >
                {l.label}
              </Link>
              <span className={cn(
                "absolute -bottom-1 left-0 w-full h-[1px] bg-primary transition-transform duration-500 origin-left",
                pathname === l.path ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              )} />
            </li>
          ))}
        </ul>

        {/* Center: Logo (Mobile & Desktop) */}
        <div className="flex items-center shrink-0 md:absolute md:left-1/2 md:-translate-x-1/2">
          <Link to="/" className="flex items-center justify-center">
            <Logo size="sm" />
          </Link>
        </div>

        {/* Center: CRECI (Mobile Only) */}
        <div className="flex md:hidden items-center justify-center flex-1 px-3">
          <span className="text-[10px] sm:text-[11px] font-mono tracking-widest font-bold text-muted-foreground/60 uppercase mt-[2px] whitespace-nowrap">
            CRECI 12345-J
          </span>
        </div>

        {/* Right: Desktop Nav & Mobile Toggle */}
        <div className="flex items-center justify-end md:flex-1 gap-4 lg:gap-6">
          
          {/* Desktop Only Right Nav */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <span className="text-[11px] lg:text-[12px] font-mono tracking-widest font-bold text-muted-foreground/60 uppercase mt-1">
              CRECI 12345-J
            </span>
            <a
              href="https://wa.me/5567991193513?text=Olá! Gostaria de falar com um especialista sobre os imóveis."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-primary border border-primary/20 hover:border-primary/40 px-4 lg:px-5 py-2.5 lg:py-3 rounded-full transition-all duration-500 bg-primary/5 btn-shine"
            >
              <svg viewBox="0 0 32 32" className="w-4 h-4 text-primary fill-current">
                <path d="M16.004 2.003c-7.724 0-13.996 6.272-13.996 13.997 0 2.467.654 4.873 1.895 6.989L2 30l7.208-1.884A13.94 13.94 0 0 0 16.004 30c7.724 0 13.996-6.272 13.996-13.997S23.728 2.003 16.004 2.003zm0 25.594a11.58 11.58 0 0 1-5.912-1.617l-.424-.252-4.397 1.152 1.174-4.29-.277-.44a11.57 11.57 0 0 1-1.776-6.15c0-6.408 5.213-11.62 11.62-11.62 6.408 0 11.62 5.213 11.62 11.62s-5.212 11.597-11.628 11.597zm6.37-8.697c-.35-.175-2.07-1.02-2.39-1.137-.32-.117-.554-.175-.787.175s-.903 1.137-1.108 1.372-.408.263-.758.088c-.35-.175-1.477-.544-2.813-1.736-1.04-.926-1.742-2.07-1.946-2.42-.204-.35-.022-.54.153-.714.157-.157.35-.408.525-.613.175-.204.233-.35.35-.583.117-.234.058-.438-.03-.613-.087-.175-.787-1.898-1.078-2.598-.284-.683-.573-.59-.787-.601-.204-.01-.438-.012-.672-.012s-.613.088-.934.438c-.32.35-1.224 1.196-1.224 2.918 0 1.722 1.253 3.386 1.428 3.62.175.233 2.466 3.765 5.976 5.28.835.36 1.486.575 1.994.737.838.266 1.601.228 2.204.138.672-.1 2.07-.846 2.362-1.663.292-.817.292-1.518.204-1.663-.088-.146-.32-.233-.672-.408z"/>
              </svg>
              Especialista
            </a>
            <Link
              to="#"
              className="bg-primary text-primary-foreground text-[9px] lg:text-[10px] font-bold tracking-[0.2em] uppercase px-5 lg:px-8 py-2.5 lg:py-3.5 rounded-full hover:bg-primary/90 transition-all shadow-lg active:scale-95 btn-shine"
            >
              Área do cliente
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-foreground flex items-center justify-center p-1 shrink-0"
            aria-label="Menu"
          >
            {open ? <X size={24} className="text-primary" /> : <Menu size={24} />}
          </button>
        </div>
      </nav>
    </header>

    {/* Mobile menu - Clean UI with priority on Falar com Especialista */}
    {open && (
      <div className="md:hidden fixed inset-0 bg-background/98 backdrop-blur-2xl z-[45] flex flex-col justify-center px-6 pt-24 pb-10 overflow-y-auto">
        <div className="flex flex-col gap-6 max-w-sm mx-auto w-full">
          {navLinks.slice(1).map((l) => (
            <Link
              key={l.path}
              to={l.path}
              onClick={() => setOpen(false)}
              className={cn(
                "text-xl sm:text-2xl font-light tracking-[0.2em] uppercase transition-colors relative block text-center pb-6 border-b border-border/50",
                pathname === l.path ? "text-primary" : "text-foreground"
              )}
            >
              {l.label}
            </Link>
          ))}
          
          <Link
            to="#"
            onClick={() => setOpen(false)}
            className="text-xl sm:text-2xl font-light tracking-[0.2em] uppercase transition-colors text-foreground text-center pb-6 border-b border-border/50"
          >
            Área do cliente
          </Link>

          <a
            href="https://wa.me/5567991193513?text=Olá! Gostaria de falar com um especialista sobre os imóveis."
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="mt-6 flex items-center justify-center gap-3 text-base sm:text-lg font-bold tracking-widest uppercase text-primary-foreground bg-gold-gradient hover:opacity-90 py-5 rounded-full shadow-lg shadow-primary/20 transition-all btn-shine"
          >
            <svg viewBox="0 0 32 32" className="w-6 h-6 fill-current">
              <path d="M16.004 2.003c-7.724 0-13.996 6.272-13.996 13.997 0 2.467.654 4.873 1.895 6.989L2 30l7.208-1.884A13.94 13.94 0 0 0 16.004 30c7.724 0 13.996-6.272 13.996-13.997S23.728 2.003 16.004 2.003zm0 25.594a11.58 11.58 0 0 1-5.912-1.617l-.424-.252-4.397 1.152 1.174-4.29-.277-.44a11.57 11.57 0 0 1-1.776-6.15c0-6.408 5.213-11.62 11.62-11.62 6.408 0 11.62 5.213 11.62 11.62s-5.212 11.597-11.628 11.597zm6.37-8.697c-.35-.175-2.07-1.02-2.39-1.137-.32-.117-.554-.175-.787.175s-.903 1.137-1.108 1.372-.408.263-.758.088c-.35-.175-1.477-.544-2.813-1.736-1.04-.926-1.742-2.07-1.946-2.42-.204-.35-.022-.54.153-.714.157-.157.35-.408.525-.613.175-.204.233-.35.35-.583.117-.234.058-.438-.03-.613-.087-.175-.787-1.898-1.078-2.598-.284-.683-.573-.59-.787-.601-.204-.01-.438-.012-.672-.012s-.613.088-.934.438c-.32.35-1.224 1.196-1.224 2.918 0 1.722 1.253 3.386 1.428 3.62.175.233 2.466 3.765 5.976 5.28.835.36 1.486.575 1.994.737.838.266 1.601.228 2.204.138.672-.1 2.07-.846 2.362-1.663.292-.817.292-1.518.204-1.663-.088-.146-.32-.233-.672-.408z"/>
            </svg>
            Falar com Especialista
          </a>
        </div>
      </div>
    )}
    </>
  );
}

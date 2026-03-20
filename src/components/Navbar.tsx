import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

const navLinks = [
  { label: "Início", path: "/" },
  { label: "Imóveis", path: "/imoveis" },
  { label: "Simulador", path: "/simulador" },
];

const WHATSAPP = "5567996241515";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <nav className="container mx-auto flex items-center justify-between h-20 md:h-24 px-4 md:px-6">
        {/* Left nav */}
        <ul className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((l) => (
            <li key={l.path}>
              <Link
                to={l.path}
                className={cn(
                  "text-sm font-medium tracking-widest uppercase transition-colors duration-300 hover:text-primary",
                  pathname === l.path ? "text-primary" : "text-foreground/70"
                )}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Logo center */}
        <Link to="/" className="absolute left-1/2 -translate-x-1/2">
          <Logo size="sm" />
        </Link>

        {/* Right nav */}
        <div className="hidden md:flex items-center gap-4 lg:gap-8">
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground hidden lg:inline">
            CRECI 7903 J
          </span>
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs lg:text-sm font-medium tracking-widest uppercase text-foreground/70 hover:text-primary transition-colors duration-300"
          >
            <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor" className="text-[#25D366]">
              <path d="M16.004 2.003c-7.724 0-13.996 6.272-13.996 13.997 0 2.467.654 4.873 1.895 6.989L2 30l7.208-1.884A13.94 13.94 0 0 0 16.004 30c7.724 0 13.996-6.272 13.996-13.997S23.728 2.003 16.004 2.003zm0 25.594a11.58 11.58 0 0 1-5.912-1.617l-.424-.252-4.397 1.152 1.174-4.29-.277-.44a11.57 11.57 0 0 1-1.776-6.15c0-6.408 5.213-11.62 11.62-11.62 6.408 0 11.62 5.213 11.62 11.62s-5.212 11.597-11.628 11.597zm6.37-8.697c-.35-.175-2.07-1.02-2.39-1.137-.32-.117-.554-.175-.787.175s-.903 1.137-1.108 1.372-.408.263-.758.088c-.35-.175-1.477-.544-2.813-1.736-1.04-.926-1.742-2.07-1.946-2.42-.204-.35-.022-.54.153-.714.157-.157.35-.408.525-.613.175-.204.233-.35.35-.583.117-.234.058-.438-.03-.613-.087-.175-.787-1.898-1.078-2.598-.284-.683-.573-.59-.787-.601-.204-.01-.438-.012-.672-.012s-.613.088-.934.438c-.32.35-1.224 1.196-1.224 2.918 0 1.722 1.253 3.386 1.428 3.62.175.233 2.466 3.765 5.976 5.28.835.36 1.486.575 1.994.737.838.266 1.601.228 2.204.138.672-.1 2.07-.846 2.362-1.663.292-.817.292-1.518.204-1.663-.088-.146-.32-.233-.672-.408z"/>
            </svg>
            <span className="hidden lg:inline">Falar com especialista</span>
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-foreground z-50"
          aria-label="Menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden fixed inset-0 bg-background/95 backdrop-blur-lg z-40 flex flex-col items-center justify-center gap-6 px-6">
          {navLinks.map((l) => (
            <Link
              key={l.path}
              to={l.path}
              onClick={() => setOpen(false)}
              className="text-xl font-light tracking-widest uppercase text-foreground hover:text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 text-xl font-light tracking-widest uppercase text-foreground hover:text-primary transition-colors"
          >
            <svg viewBox="0 0 32 32" width="24" height="24" fill="#25D366">
              <path d="M16.004 2.003c-7.724 0-13.996 6.272-13.996 13.997 0 2.467.654 4.873 1.895 6.989L2 30l7.208-1.884A13.94 13.94 0 0 0 16.004 30c7.724 0 13.996-6.272 13.996-13.997S23.728 2.003 16.004 2.003zm0 25.594a11.58 11.58 0 0 1-5.912-1.617l-.424-.252-4.397 1.152 1.174-4.29-.277-.44a11.57 11.57 0 0 1-1.776-6.15c0-6.408 5.213-11.62 11.62-11.62 6.408 0 11.62 5.213 11.62 11.62s-5.212 11.597-11.628 11.597zm6.37-8.697c-.35-.175-2.07-1.02-2.39-1.137-.32-.117-.554-.175-.787.175s-.903 1.137-1.108 1.372-.408.263-.758.088c-.35-.175-1.477-.544-2.813-1.736-1.04-.926-1.742-2.07-1.946-2.42-.204-.35-.022-.54.153-.714.157-.157.35-.408.525-.613.175-.204.233-.35.35-.583.117-.234.058-.438-.03-.613-.087-.175-.787-1.898-1.078-2.598-.284-.683-.573-.59-.787-.601-.204-.01-.438-.012-.672-.012s-.613.088-.934.438c-.32.35-1.224 1.196-1.224 2.918 0 1.722 1.253 3.386 1.428 3.62.175.233 2.466 3.765 5.976 5.28.835.36 1.486.575 1.994.737.838.266 1.601.228 2.204.138.672-.1 2.07-.846 2.362-1.663.292-.817.292-1.518.204-1.663-.088-.146-.32-.233-.672-.408z"/>
            </svg>
            Contato
          </a>
          <span className="text-xs font-mono tracking-widest uppercase text-muted-foreground mt-4">
            CRECI 7903 J
          </span>
        </div>
      )}
    </header>
  );
}

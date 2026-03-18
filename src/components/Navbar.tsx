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

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <nav className="container mx-auto flex items-center justify-between h-20 px-6">
        {/* Left nav */}
        <ul className="hidden md:flex items-center gap-8">
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

        {/* Logo center — text-only lettering */}
        <Link to="/" className="absolute left-1/2 -translate-x-1/2">
          <Logo size="sm" className="hidden md:block" />
          <Logo size="sm" className="md:hidden" />
        </Link>

        {/* Right nav */}
        <div className="hidden md:flex items-center gap-8">
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            CRECI 12345-J
          </span>
          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium tracking-widest uppercase text-foreground/70 hover:text-primary transition-colors duration-300"
          >
            Contato
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
        <div className="md:hidden fixed inset-0 bg-background/95 backdrop-blur-lg z-40 flex flex-col items-center justify-center gap-8">
          {navLinks.map((l) => (
            <Link
              key={l.path}
              to={l.path}
              onClick={() => setOpen(false)}
              className="text-2xl font-light tracking-widest uppercase text-foreground hover:text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="text-2xl font-light tracking-widest uppercase text-foreground hover:text-primary transition-colors"
          >
            Contato
          </a>
          <span className="text-xs font-mono tracking-widest uppercase text-muted-foreground mt-4">
            CRECI 12345-J
          </span>
        </div>
      )}
    </header>
  );
}

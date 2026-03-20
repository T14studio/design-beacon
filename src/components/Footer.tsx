import { Link } from "react-router-dom";
import { MapPin, Phone, Mail } from "lucide-react";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-4">
              <Logo size="sm" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              O melhor imóvel com quem entende disso. Quando trabalhamos coletivamente em prol de um objetivo, conquistamos o impossível.
            </p>
            <p className="text-xs font-mono tracking-widest uppercase text-primary">
              CRECI 7903 J
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-mono text-xs tracking-widest uppercase text-primary mb-4">
              Navegação
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/imoveis" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Imóveis
                </Link>
              </li>
              <li>
                <Link to="/simulador" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Simulador
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-mono text-xs tracking-widest uppercase text-primary mb-4">
              Contato
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone size={14} className="text-primary flex-shrink-0" />
                +55 67 99624-1515
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail size={14} className="text-primary flex-shrink-0" />
                contato@eticaimoveisbr.com.br
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin size={14} className="text-primary mt-0.5 flex-shrink-0" />
                <span>Rua Alagoas, 396 — SL 1403<br />Campo Grande — MS</span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-mono text-xs tracking-widest uppercase text-primary mb-4">
              Horário
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Seg — Sex: 9h às 18h<br />
              Sáb: 10h às 14h<br />
              Dom: Sob agendamento
            </p>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-border py-6 md:py-8 overflow-hidden">
        <p className="text-center text-[10px] md:text-xs text-muted-foreground/40 tracking-widest uppercase px-4">
          © {new Date().getFullYear()} Ética Áxis Imobiliária — CRECI 7903 J — Todos os direitos reservados
        </p>
      </div>
    </footer>
  );
}

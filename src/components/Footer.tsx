import { Link } from "react-router-dom";
import { MapPin, Phone, Mail } from "lucide-react";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="mb-4">
              <Logo size="md" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Excelência em imóveis de alto padrão. Sua nova história começa aqui.
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
                  Home
                </Link>
              </li>
              <li>
                <Link to="/imoveis?mode=locacao" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Desejo Alugar
                </Link>
              </li>
              <li>
                <Link to="/imoveis?mode=venda" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Desejo Comprar
                </Link>
              </li>
              <li>
                <Link to="/simulador" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Simulador de Financiamento
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

              <li className="flex items-center gap-2 text-sm text-muted-foreground break-all">
                <Mail size={14} className="text-primary flex-shrink-0" />
                <span className="break-all">comercial@eticaimoveisbr.com.br</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin size={14} className="text-primary mt-1 flex-shrink-0" />
                <div className="flex flex-col gap-2">
                  <span>Rua Alagoas, 396, Sala 908<br />Jardim dos Estados<br />Campo Grande — MS</span>
                  <span className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">
                    CRECI 12345-J
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-mono text-xs tracking-widest uppercase text-primary mb-4">
              Horário
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Seg — Sex: 08h às 11:30<br />
              13h às 17:30<br />
              Sáb e Dom: Fechado
            </p>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-border py-6 sm:py-8 px-4 sm:px-6 overflow-hidden">
        <p className="text-center text-[9px] sm:text-xs text-muted-foreground/60 tracking-wider sm:tracking-widest uppercase leading-relaxed max-w-sm sm:max-w-none mx-auto">
          © {new Date().getFullYear()} Ética Áxis Imobiliária<br className="sm:hidden" />
          CRECI 12345-J — Desde 2015<br className="sm:hidden" />
          Todos os direitos reservados
        </p>
      </div>
    </footer>
  );
}

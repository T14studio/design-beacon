import { Link } from "react-router-dom";
import { MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <img
              src="/logo-etica-axis.png"
              alt="Ética Áxis"
              className="h-8 mb-4"
            />
            <p className="text-sm text-muted-foreground leading-relaxed">
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
                  Início
                </Link>
              </li>
              <li>
                <Link to="/imoveis" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Imóveis
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
                <Phone size={14} className="text-primary" />
                (11) 99999-9999
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail size={14} className="text-primary" />
                contato@eticaaxis.com.br
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin size={14} className="text-primary mt-0.5" />
                Av. Faria Lima, 3000<br />São Paulo — SP
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

      {/* Bottom brand watermark */}
      <div className="border-t border-border py-8 overflow-hidden">
        <p className="text-center text-xs text-muted-foreground/40 tracking-widest uppercase">
          © {new Date().getFullYear()} Ética Áxis Imobiliária — Todos os direitos reservados
        </p>
      </div>
    </footer>
  );
}

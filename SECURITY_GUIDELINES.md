# Diretrizes de Segurança (Cloudflare & Hostinger)

Este documento contém instruções passo a passo para habilitar recursos essenciais de segurança no seu provedor de DNS/Hospedagem, respeitando a política de **Zero Regressão** (sem impacto no funcionamento atual do sistema).

## 1. Cloudflare

Se você estiver gerenciando seus domínios através da Cloudflare, ative as seguintes configurações no painel:

### 1.1 SSL/TLS
- Vá em **SSL/TLS -> Overview**.
- Mude a criptografia para **Full (strict)**.
- *Motivo: Garante criptografia de ponta a ponta sem certificados inválidos.*

- Vá em **SSL/TLS -> Edge Certificates**.
- Ative o **Always Use HTTPS**.
- Ative o **HTTP Strict Transport Security (HSTS)** (Habilite para todos os subdomínios, max-age: 12 meses).
- Mínimo TLS Version: Defina para **TLS 1.2**.

### 1.2 WAF e Proteção contra Bots
- Vá em **Security -> Settings**.
- Ative o **Browser Integrity Check**.
- Vá em **Security -> Bots**.
- Ative o **Bot Fight Mode**.
- *Motivo: Bloqueia scrapers e bots maliciosos de enviarem SPAM no seu formulário sem colocar captchas intrusivos na tela.*

### 1.3 Velocidade e Otimização
- Vá em **Speed -> Optimization**.
- Ative o **Brotli** e **HTTP/3 (com QUIC)**.
- Ative o **Auto Minify** para JavaScript, CSS e HTML.
- *Motivo: Aumenta a velocidade de carregamento (SEO) reduzindo a janela de timeout para ataques lentos.*

## 2. Hostinger

Se a aplicação, APIs ou bancos de dados possuem recursos operando diretamente na Hostinger (ou se seu painel principal é lá):

### 2.1 Firewall e Proteção Básica
- No hPanel, vá em **Segurança -> Firewall**.
- Confirme se as regras padrão de bloqueio de IPs maliciosos da Hostinger estão ativadas.
- *Risco: Nenhum. Aumenta a defesa perimetral.*

### 2.2 Directory Listing
- No Gerenciador de Arquivos, certifique-se de que a raiz do seu site web possui regras desabilitando o `Directory Listing` (no `.htaccess` ou configuração do nginx local).
- *Motivo: Impede que visitantes vejam uma lista de arquivos expostos nas pastas.*

### 2.3 Backups Regulares
- Vá em **Arquivos -> Backups**.
- Configure backups diários automatizados para arquivos e banco de dados.
- *Motivo: Essencial em planos de Disaster Recovery.*

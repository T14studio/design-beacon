# AXIS — Experiência do Usuário no Site (Integração v1)

Este documento descreve como a Axis está integrada ao front-end da imobiliária para fornecer uma experiência fluida e context-aware.

## 1. Pontos de Entrada (CTAs)

### Botão Flutuante Global (`WhatsAppButton.tsx`)
- **Localização:** Canto inferior direito em todas as páginas.
- **Função:** Abre o widget de chat nativo da Axis.
- **Micro-animação:** Efeito de "ping" para indicar disponibilidade.

### Botão de Interesse em Imóvel (`PropertyDetail.tsx`)
- **Localização:** Sidebar da página de detalhes do imóvel.
- **Texto:** "Falar com a Axis".
- **Função:** Abre o chat injetando o contexto do imóvel atual.

## 2. Gatilhos de Contexto (Context Triggers)

A integração utiliza o objeto `optional_context` para informar a Axis sobre a navegação do usuário:

- **Propriedades Enviadas:**
    - `page_url`: URL da página atual.
    - `property_id`: ID/Código do imóvel visualizado.
    - `property_title`: Nome do imóvel.

## 3. Fluxo de Conversa no Site

Diferente do WhatsApp, o chat no site permite uma interação imediata sem sair da página:

1. **Início:** O usuário clica no CTA.
2. **Reconhecimento:** Se houver `property_id`, a Axis inicia confirmando o interesse naquele imóvel específico.
3. **Persistência:** O `session_id` é mantido no `localStorage`, garantindo que a conversa continue mesmo se o usuário navegar entre páginas de diferentes imóveis.
4. **Handoff:** Quando o transbordo é acionado, o front-end recebe a flag `handoff_recomendado: true` e pode exibir uma mensagem final de confirmação ou redirecionar o usuário.

## 4. Estilo e Acessibilidade

- **Design:** Glassmorphism com o esquema de cores `gold-gradient` da marca.
- **Identidade:** Avatar da Axis e indicação de "IA Digitando..." para gerenciar expectativas de latência.
- **Z-Index:** Configurado em 60 para garantir visibilidade sobre todos os componentes de UI (Modais, Navbars).

---
*Versão 1.0 | Data: 2026-04-06*

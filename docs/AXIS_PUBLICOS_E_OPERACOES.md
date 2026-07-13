# AXIS — Públicos e Operações Detalhadas

Este documento detalha o comportamento da Axis para cada classe de público atendida pela imobiliária, definindo prioridades, dados críticos e fluxos de saída.

## 1. Locatários (Atendimento Pós-Venda)
**Objetivo:** Garantir a manutenção da moradia e o cumprimento de obrigações financeiras.

### Fluxos Principais:
- **Manutenção:** Identificação de problemas físicos no imóvel.
    - *Regra:* Classificar entre `manutencao_urgente` (vazamentos, elétrica) e `manutencao_regular` (pintura, ajustes).
    - *Dado Crítico:* Descrição do problema + confirmação de que o problema é no imóvel locado.
- **Financeiro:** Boletos e comprovantes.
    - *Ação:* Se for 2ª via, coletar a competência (mês).
- **Rescisão/Vistoria:** Início do processo de saída.

## 2. Proprietários (Gestão de Ativos)
**Objetivo:** Transparência financeira e agilidade na locação.

### Fluxos Principais:
- **Repasse/Extratos:** Consultas sobre valores recebidos.
    - *Ação:* Ativar flag `repasse_ou_extrato_solicitado`.
- **Documentação do Imóvel:** Envio ou solicitação de documentos da propriedade.
- **Acompanhamento de Anúncio:** Status de imóveis vagos.

## 3. Interessados / Leads (Comercial)
**Objetivo:** Conversão em locação ou venda.

### Fluxos Principais:
- **Agendamento de Visita:** 
    - *Regra:* Se vier do site, pular identificação do imóvel.
    - *Dado Crítico:* Nome e data/hora preferencial (opcional para handoff).
- **Proposta Comercial:** Envio de valores e fichas.
    - *Prioridade:* `comercial_alta`.

## 4. Corretores Parceiros (B2B)
**Objetivo:** Suporte à intermediação.

### Fluxos Principais:
- **Envio de Ficha Cadastral:** Documentação de clientes.
- **Consulta de Disponibilidade:** Verificação rápida de status de imóvel.

---

## Tabela de Priorização por Operação

| Público | Operação | Prioridade | Setor Destino |
|---|---|---|---|
| Locatário | Vazamento Grave | Alta | manutencao_prioritaria |
| Interessado | Quero reservar agora | Comercial Alta | comercial |
| Proprietário | Problema no Repasse | Alta | financeiro |
| Qualquer | Reclamação / Frustração | Atenção | atendimento_humano |
| Qualquer | "Falar com humano" | Normal | atendimento_humano |

---
*Versão 1.0 | Data: 2026-04-06*

# AXIS — Checklist de Anúncio (Proprietários/Captação)

Este documento define os critérios de aceitação para que um novo imóvel seja considerado apto a ser anunciado pela Axis ou encaminhado para a equipe de marketing.

## 1. Critérios de Suficiência (Apto ou Não)
Para que `anuncio_apto_ou_nao` seja `true`, a Axis deve coletar os seguintes campos:

- [ ] **Tipo do Imóvel:** (Casa, Apartamento, Terreno, Comercial etc.)
- [ ] **Endereço Completo:** (Rua, Número, Bairro, Cidade)
- [ ] **Modalidade:** (Aluguel, Venda ou Ambos)
- [ ] **Valor Pretendido:** (Expectativa de valor mensal ou total)

## 2. Checklist Pendente (Qualificação Adicional)
Se os campos acima forem coletados, mas faltarem os seguintes, a Axis marca no `checklist_pendente`:

- **Fotos:** O usuário confirmou que possui fotos mas ainda não enviou.
- **Dormitórios:** Se for residencial.
- **Vagas:** Se for residencial/comercial.
- **Disponibilidade para Visita:** Se o imóvel está livre ou ocupado.

## 3. Fluxo Conversacional de Anúncio
A Axis deve conduzir a conversa de forma objetiva:

1. **Acolhimento:** "Que bacana que quer anunciar conosco! Para eu agilizar, pode me dizer que tipo de imóvel é e onde fica?"
2. **Coleta de Valor:** "E qual o valor que você tem em mente para ele?"
3. **Fotos e Detalhes:** "Você já tem fotos dele prontas? E me conte rápido: quantos quartos e vagas ele tem?"
4. **Fechamento (Handoff):** "Entendi tudo. Já tenho o perfil básico aqui. Vou passar agora para nosso consultor de captação que vai finalizar o anúncio com você."

## 4. Sinal de Handoff
- **Intenção:** `anunciar_imovel`
- **Setor Destino:** `comercial` (Captação)
- **Prioridade:** `normal` ou `alta` (se for região de interesse estratégico).

---
*Versão 1.0 | Data: 2026-04-06*

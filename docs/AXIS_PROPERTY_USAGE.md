# Estratégia de Uso de Imóveis (Property Context) - Axis

Esta documentação define como a inteligência da Axis orquestrará a busca e reconhecimento de produtos imobiliários durante o runtime da conversa.

## Cenários de Input do Cliente

### 1. Cliente vem de PÁGINA DE IMÓVEL (Contexto Site)
**Gatilho:** Parâmetro `optional_context` preenchido com ID/Slug do imóvel.
**Ação do Motor n8n:**
- Node Supabase busca detalhes do imóvel.
- Injeta no prompt: `{{CONTEXTO_IMOVEL}}` = { "id": "123", "title": "Casa 4 Quartos", ... }.
- Axis reconhece: `contexto_do_site_identificado: true`, `origem_do_contexto_do_imovel: "site_pagina_imovel"`.
**Resposta da Axis:** "Vi que você se interessou pela Casa de 4 Quartos no Centro. Ela é incrível! Gostaria de agendar uma visita?"

### 2. Cliente manda o LINK do site no chat
**Gatilho:** Input contém URL do site.
**Ação do Motor:**
- Regex extrai o slug.
- Motor injeta o contexto como se o usuário tivesse vindo da página.
- Marcar `origem_do_contexto_do_imovel: "usuario_informou"`.

### 3. Cliente manda o CÓDIGO de referência (Ex: "Imóvel 334")
**Gatilho:** Input contém código numérico curto ou prefixo REF.
**Ação:** Match SQL e injeção de contexto.

---

## Regras de Materialização e Persuasão (Lead de Venda)

Para maximizar a conversão, o reconhecimento de um imóvel (seja via site ou código) deve seguir protocolos rígidos:

1.  **Vocalização Obrigatória:** A Axis deve SEMPRE mencionar o título ou referência do imóvel na resposta imediata (Ex: "Vi que você está olhando o Flat Prime"). Nunca use apenas "este imóvel".
2.  **Persuasão Comercial:** Se o imóvel for de **Venda**, a Axis deve reforçar o valor (Ex: "O Flat Prime é uma excelente escolha para investimento").
3.  **Bypass de Dados Básicos:** Se a Axis já tem o `property_id` no contexto, ela pula a pergunta "Qual imóvel você tem interesse?".
4.  **Elevação de Prioridade:** Leads com imóvel identificado recebem `prioridade: comercial_alta` se demonstrarem intenção de visita ou fechamento.
5.  **Payload Estruturado:** O `HandoffOutput` deve conter o `imovel_ou_contrato_relacionado` preenchido para que o corretor já saiba de qual produto se trata.
6.  **Sugestão de CTAs:** Se houver um imóvel em contexto, a Axis deve sugerir CTAs específicos como `['Agendar visita', 'Fazer simulação', 'Propriedades Semelhantes']`.

## Mecanismo de Previsibilidade e Memória
A inclusão do campo `property_id` no State manager e a injeção do bloco de **MEMÓRIA DE SESSÃO PERSISTIDA** garantem que a Axis mantenha o foco no imóvel mesmo após 5+ turnos ou recarregamento de página. O n8n passa no payload o `property_title` e `property_id` em todos os turnos subsequentes à identificação.

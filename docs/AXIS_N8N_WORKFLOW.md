# AXIS — Workflow Operacional n8n (Etapa 4)
**Versão:** 1.0
**Canal inicial:** `api_test` (sem WhatsApp)
**Runtime:** n8n + OpenAI Responses API + Supabase

---

## 1. RESUMO EXECUTIVO

Este documento especifica o workflow operacional completo da Axis no n8n para validação via HTTP/Webhook antes da integração com canais reais (WhatsApp, Site). A Axis entra no fluxo como **agente estruturado com output previsível** — não como chat livre. Cada turno executa um ciclo determinístico: hidratação de contexto → chamada à Responses API com structured output → persistência → decisão de handoff.

---

## 2. ARQUITETURA DO FLUXO

```
[Webhook Inbound]
       ↓
[Validação do Payload]
       ↓
[Identificar Código/Imóvel via Regex & Consulta Supabase] (NOVO)
       ↓
[Upsert Customer (Supabase)]
       ↓
[Localizar/Criar Session (Supabase)]
       ↓
[Registrar Mensagem Inbound (Supabase)]
       ↓
[Ler Histórico e Contexto (Supabase)]
       ↓
[Montar Prompt da Axis]
       ↓
[OpenAI Responses API — Structured Output]
       ↓
[Interpretar Resposta Estruturada]
       ↓
[Registrar Mensagem Outbound (Supabase)]
       ↓
[Atualizar Session State (Supabase)]
       ↓
[Decisão: Handoff?]
     ↓ SIM          ↓ NÃO
[Criar Ticket]   [Continuar]
[Atualizar Session is_active=false]
       ↓
[Webhook Response ao Caller]
```

---

## 3. NODES DO N8N EM SEQUÊNCIA

### Node 1 — `Webhook: Axis Inbound`
**Tipo:** Webhook (POST)
**Rota:** `/axis/v1/turn`
**Método:** POST
**Função:** Ponto de entrada do workflow. Recebe o payload do canal de teste.

---

### Node 2 — `Code: Validate Payload`
**Tipo:** Code (JavaScript)
**Função:** Valida campos obrigatórios do payload.
```javascript
const { phone, message, channel } = $input.first().json;

if (!phone || !message || !channel) {
  throw new Error('Payload inválido: phone, message e channel são obrigatórios.');
}

return [{
  json: {
    phone: phone.replace(/\D/g, ''), // Normaliza apenas dígitos
    message: message.trim(),
    channel: channel || 'api_test',
    optional_context: $input.first().json.optional_context || null
  }
}];
```

---

### Node 2.5 — `Code & Supabase: Property Lookup` (Novo)
**Tipo:** Regex Capture + HTTP (Supabase REST)
**Função:** Detecta links ou referências a códigos de imóvel (`REF\d+` ou slug web). Se matchar, consulta Tabela `properties`.
**Variável Resultante:** `$property_payload` (Contendo Título, Valor, ID).

---

### Node 3 — `Supabase: Upsert Customer`
**Tipo:** HTTP Request (Supabase REST)
**Método:** POST
**URL:** `{{SUPABASE_PROJECT_URL}}/rest/v1/customers`
**Headers:**
```
apikey: {{SUPABASE_ANON_KEY}}
Authorization: Bearer {{SUPABASE_ANON_KEY}}
Content-Type: application/json
Prefer: resolution=merge-duplicates,return=representation
```
**Body:**
```json
{
  "channel": "{{ $node['Code: Validate Payload'].json.channel }}",
  "channel_user_id": "{{ $node['Code: Validate Payload'].json.phone }}"
}
```
**Output:** `customer_id` (UUID do customer criado ou encontrado)

---

### Node 4 — `Supabase: Find Active Session`
**Tipo:** HTTP Request (Supabase REST)
**Método:** GET
**URL:** `{{SUPABASE_PROJECT_URL}}/rest/v1/sessions?channel_user_id=eq.{{phone}}&is_active=eq.true&order=created_at.desc&limit=1`
**Headers:** (padrão Supabase)

**Node 4b — `IF: Session Exists?`**
Verifica se o array retornado tem length > 0.
- **SIM** → captura `session_id` e `current_state`
- **NÃO** → segue para Node 5 (criar sessão)

---

### Node 5 — `Supabase: Create Session` (condicional)
**Tipo:** HTTP Request
**Método:** POST
**URL:** `{{SUPABASE_PROJECT_URL}}/rest/v1/sessions`
**Body:**
```json
{
  "channel": "{{ $node['Code: Validate Payload'].json.channel }}",
  "channel_user_id": "{{ $node['Code: Validate Payload'].json.phone }}",
  "customer_id": "{{ $node['Supabase: Upsert Customer'].json[0].id }}",
  "current_state": "recepcao",
  "is_active": true,
  "loop_counter": 0,
  "handoff_ready": false,
  "collected_data": {},
  "detected_signals": {
    "urgency": false,
    "frustration": false,
    "commercial_heat": false
  }
}
```

---

### Node 6 — `Supabase: Insert Inbound Message`
**Tipo:** HTTP Request
**Método:** POST
**URL:** `{{SUPABASE_PROJECT_URL}}/rest/v1/messages`
**Body:**
```json
{
  "session_id": "{{ $session_id }}",
  "role": "user",
  "content": "{{ $node['Code: Validate Payload'].json.message }}"
}
```

---

### Node 7 — `Supabase: Read Message History`
**Tipo:** HTTP Request
**Método:** GET
**URL:** `{{SUPABASE_PROJECT_URL}}/rest/v1/messages?session_id=eq.{{session_id}}&order=created_at.asc&limit=20`
**Função:** Recupera as últimas N mensagens da sessão para injetar no contexto do prompt.

---

### Node 8 — `Code: Build Axis Prompt`
**Tipo:** Code (JavaScript)
**Função:** Monta o system prompt com variáveis dinâmicas e o array de mensagens para a Responses API.
```javascript
const session = $node['Session Data'].json;
const messages = $node['Supabase: Read Message History'].json;
const newMessage = $node['Code: Validate Payload'].json.message;

// Lê o system prompt do arquivo (ou hardcoded neste node para simplicidade)
// As variáveis {{ESTADO_ATUAL}}, {{DADOS_COLETADOS}}, etc. são substituídas aqui

const historico = messages
  .filter(m => m.role !== 'system')
  .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
  .join('\n');

const systemPrompt = `
[...conteúdo completo do prompts/system_prompt.md...]
`.replace('{{NOME_DA_IMOBILIARIA}}', 'Nome da Imobiliária')
 .replace('{{ESTADO_ATUAL}}', session.current_state || 'recepcao')
 .replace('{{DADOS_COLETADOS}}', JSON.stringify(session.collected_data || {}))
 .replace('{{DADOS_FALTANTES}}', JSON.stringify(session.dados_faltantes || []))
 .replace('{{CONTEXTO_IMOVEL}}', propertyPayload ? `O cliente está consultando o imóvel: ${JSON.stringify(propertyPayload)}` : '')
 .replace('{{HISTORICO_MENSAGENS}}', historico || 'Início da conversa.');

return [{
  json: {
    system_prompt: systemPrompt,
    user_message: newMessage,
    session_id: session.id,
    current_state: session.current_state
  }
}];
```

---

### Node 9 — `HTTP: OpenAI Responses API`
**Tipo:** HTTP Request
**Método:** POST
**URL:** `https://api.openai.com/v1/responses`
**Headers:**
```
Authorization: Bearer {{OPENAI_API_KEY}}
Content-Type: application/json
```
**Body:**
```json
{
  "model": "gpt-4o-mini",
  "input": [
    {
      "role": "system",
      "content": "{{ $node['Code: Build Axis Prompt'].json.system_prompt }}"
    },
    {
      "role": "user",
      "content": "{{ $node['Code: Build Axis Prompt'].json.user_message }}"
    }
  ],
  "text": {
    "format": {
      "type": "json_schema",
      "name": "axis_turn_output",
      "strict": true,
      "schema": { ... }
    }
  }
}
```
> **Nota:** O schema completo de `axis_turn_output` está em `prompts/axis_output_schema.json` e deve ser embutido aqui no n8n via Expression ou lido de um node Set.

---

### Node 10 — `Code: Parse Axis Response`
**Tipo:** Code (JavaScript)
**Função:** Extrai e valida o JSON estruturado da resposta da Responses API.
```javascript
const raw = $input.first().json;
const outputText = raw.output[0].content[0].text;
const parsed = JSON.parse(outputText);

// Validação mínima de campos críticos
if (!parsed.message_to_user || !parsed.etapa_da_conversa) {
  throw new Error('Output da Axis inválido: campos obrigatórios ausentes.');
}

return [{ json: parsed }];
```

---

### Node 11 — `Supabase: Insert Outbound Message`
**Tipo:** HTTP Request
**Método:** POST
**URL:** `{{SUPABASE_PROJECT_URL}}/rest/v1/messages`
**Body:**
```json
{
  "session_id": "{{ $session_id }}",
  "role": "assistant",
  "content": "{{ $node['Code: Parse Axis Response'].json.message_to_user }}",
  "nlu_metadata": {
    "intencao_principal": "{{ $node['Code: Parse Axis Response'].json.intencao_principal }}",
    "prioridade": "{{ $node['Code: Parse Axis Response'].json.prioridade }}",
    "nivel_de_confianca": "{{ $node['Code: Parse Axis Response'].json.nivel_de_confianca }}",
    "handoff_recomendado": "{{ $node['Code: Parse Axis Response'].json.handoff_recomendado }}"
  }
}
```

---

### Node 12 — `Supabase: Update Session State`
**Tipo:** HTTP Request
**URL:** `{{SUPABASE_PROJECT_URL}}/rest/v1/sessions?id=eq.{{session_id}}`
**Body:**
```json
{
  "current_state": "{{ axisOutput.etapa_da_conversa }}",
  "intent_principal": "{{ axisOutput.intencao_principal }}",
  "subintencao": "{{ axisOutput.subintencao }}",
  "estagio_jornada": "{{ axisOutput.estagio_da_jornada }}",
  "loop_counter": "{{ session.loop_counter + 1 }}",
  "handoff_ready": "{{ axisOutput.handoff_recomendado }}",
  "collected_data": "{{ mergedCollectedData }}",
  "detected_signals": {
    "urgency": "{{ axisOutput.urgencia_detectada }}",
    "frustration": "{{ axisOutput.frustracao_detectada }}",
    "commercial_heat": "{{ axisOutput.alta_intencao_comercial }}"
  },
  "operational_metadata": {
    "necessidade_operacional": "{{ axisOutput.necessidade_operacional }}",
    "anuncio_apto_ou_nao": "{{ axisOutput.anuncio_apto_ou_nao }}",
    "manutencao_requer_chamado": "{{ axisOutput.manutencao_requer_chamado }}",
    "repasse_ou_extrato_solicitado": "{{ axisOutput.repasse_ou_extrato_solicitado }}"
  }
}
```

---

### Node 13 — `IF: Handoff Recomendado?`
**Condição:** `$node['Code: Parse Axis Response'].json.handoff_recomendado === true`

---

### Node 14 — `Supabase: Create Handoff Ticket`
**URL:** `{{SUPABASE_PROJECT_URL}}/rest/v1/handoff_tickets`
**Body:**
```json
{
  "session_id": "{{ $session_id }}",
  "setor_destino": "{{ axisOutput.setor_destino }}",
  "prioridade": "{{ axisOutput.prioridade }}",
  "status": "aberto",
  "payload": {
    "resumo_do_caso": "{{ axisOutput.resumo_do_caso }}",
    "proxima_acao": "{{ axisOutput.proxima_acao }}",
    "tipo_de_publico": "{{ axisOutput.tipo_de_publico }}",
    "checklist_pendente": "{{ axisOutput.checklist_pendente }}",
    "documento_pendente": "{{ axisOutput.documento_pendente }}",
    "origem_do_contexto_do_imovel": "{{ axisOutput.origem_do_contexto_do_imovel }}",
    "contexto_do_site_identificado": "{{ axisOutput.contexto_do_site_identificado }}",
    "raw_axis_output": "{{ axisOutput }}"
  }
}
```

---

### Node 15 — `Supabase: Close Session` (condicional)
**Método:** PATCH
**URL:** `...sessions?id=eq.{{session_id}}`
**Body:** `{ "is_active": false }`

---

### Node 16 — `Webhook Response`
**Tipo:** Respond to Webhook
**Status:** 200
**Body:**
```json
{
  "status": "ok",
  "session_id": "{{ $session_id }}",
  "current_state": "{{ axisOutput.etapa_da_conversa }}",
  "message_to_user": "{{ axisOutput.message_to_user }}",
  "handoff_recomendado": "{{ axisOutput.handoff_recomendado }}",
  "setor_destino": "{{ axisOutput.setor_destino }}"
}
```

---

## 4. PAYLOAD DE TESTE

### Request Mínimo
```http
POST https://{{N8N_BASE_URL}}/webhook/axis/v1/turn
Content-Type: application/json

{
  "phone": "5511999998888",
  "message": "Oi, preciso de ajuda com o meu contrato",
  "channel": "api_test"
}
```

### Request com Urgência
```http
POST https://{{N8N_BASE_URL}}/webhook/axis/v1/turn
Content-Type: application/json

{
  "phone": "5511999997777",
  "message": "Urgente! Estourou um cano na minha sala, está vazando muita água",
  "channel": "api_test"
}
```

### Request com Alta Intenção Comercial
```http
POST https://{{N8N_BASE_URL}}/webhook/axis/v1/turn
Content-Type: application/json

{
  "phone": "5511999996666",
  "message": "Vi o imóvel código 334 no site, quero visitar hoje ainda e já quero fechar",
  "channel": "api_test"
}
```

---

## 5. RESPONSE ESPERADO

```json
{
  "status": "ok",
  "session_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "current_state": "qualificacao",
  "message_to_user": "Entendido! Para eu te direcionar corretamente, você é locatário ou o proprietário do imóvel?",
  "handoff_recomendado": false,
  "setor_destino": null
}
```

---

## 6. CHECKLIST DE VALIDAÇÃO MANUAL

### Infraestrutura
- [ ] n8n acessível e workflow ativo
- [ ] OPENAI_API_KEY configurada no n8n
- [ ] SUPABASE_PROJECT_URL e SUPABASE_ANON_KEY configuradas
- [ ] Tabelas `customers`, `sessions`, `messages`, `handoff_tickets` existem no Supabase

### Cenário 1 — Comercial (Cliente Vago)
- [ ] Input: "Quero alugar um imóvel"
- [ ] Espera: Axis pede região ou código. `etapa: diagnostico`
- [ ] Supabase: session criada com `current_state: qualificacao`
- [ ] Nenhum ticket gerado

### Cenário 2 — Comercial (Alta Intenção)
- [ ] Input: "Vi o imóvel 334, quero fechar hoje"
- [ ] Espera: Axis confirma e encaminha. `handoff_recomendado: true`
- [ ] Supabase: ticket gerado com `setor_destino: comercial`, `prioridade: comercial_alta`

### Cenário 3 — Administrativo
- [ ] Input: "Preciso de ajuda com a documentação do meu contrato de locação"
- [ ] Espera: Axis pede papel (locatário/proprietário). `etapa: qualificacao`
- [ ] Supabase: `intent_principal: documentacao`

### Cenário 4 — Financeiro
- [ ] Input: "Não recebi o meu boleto deste mês"
- [ ] Espera: Axis pede contrato ou endereço. `etapa: qualificacao`
- [ ] Supabase: `intent_principal: boleto`

### Cenário 5 — Urgência
- [ ] Input: "Vazamento de água urgente na sala!"
- [ ] Espera: Axis acolhe e encaminha IMEDIATAMENTE. `handoff_recomendado: true`, `prioridade: alta`
- [ ] Supabase: Ticket com `setor_destino: manutencao_prioritaria`. Session `is_active: false`

### Cenário 6 — Reclamação/Frustração
- [ ] Input: "Ninguém me responde faz 3 dias, já mandei várias mensagens"
- [ ] Espera: Axis valida emocionalmente e agenda escalação. `frustracao_detectada: true`, `prioridade: atencao`
- [ ] Supabase: Ticket com `motivo_do_handoff: frustracao`

### Cenário 7 — Pedido Direto de Humano
- [ ] Input: "Não quero falar com robô, preciso de uma pessoa"
- [ ] Espera: Axis pede apenas o assunto em 1 frase. handoff na sequência
- [ ] Supabase: Ticket com `motivo_do_handoff: pedido_humano`

---

## 7. DECISÃO ARQUITETURAL PENDENTE

Antes da Etapa 5 (WhatsApp), definir:
- **Persistência de Histórico:** O workflow atual lê as últimas 20 mensagens. Definir se o limite será por quantidade, por tokens estimados ou por tempo de sessão.
- **Thread ID da Responses API:** A Responses API suporta `previous_response_id` para gerenciar threads nativamente. Avaliar se usaremos threads nativas (mais simples, menos controle) ou histórico manual via Supabase (mais controle, mais nodes).
- **Service Role Key:** Para operações privilegiadas (PATCH com RLS ativo), o workflow precisará da `SUPABASE_SERVICE_ROLE_KEY` configurada. Ainda pendente.
